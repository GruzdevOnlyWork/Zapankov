import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import path from 'path';

const router = Router();
const prisma = new PrismaClient();
const FONT_PATH = path.join(__dirname, '..', 'fonts', 'DejaVuSans.ttf');

router.use(authMiddleware);

const TYPE_NAMES: Record<string, string> = {
  gates: 'Ворота', stairs: 'Лестница', canopy: 'Навес',
  fence: 'Ограждение', frame: 'Каркас', other: 'Другое',
};
const STATUS_NAMES: Record<string, string> = {
  new: 'Новая заявка', measuring: 'Замеры', approval: 'Согласование',
  production: 'Изготовление', installation: 'Монтаж', done: 'Выполнен', cancelled: 'Отменён',
};

function buildDateWhere(startDate?: string, endDate?: string) {
  const where: any = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }
  return where;
}

function formatDate(d: Date | null): string {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ru-RU');
}

router.get('/orders', async (req: AuthRequest, res: Response): Promise<void> => {
  const { startDate, endDate, status } = req.query;
  const where: any = buildDateWhere(startDate as string, endDate as string);
  if (status && status !== 'all') where.status = status as string;

  const orders = await prisma.order.findMany({
    where,
    include: { client: true },
    orderBy: { createdAt: 'desc' },
  });

  const summary = {
    total: orders.length,
    totalAmount: orders.reduce((sum, o) => sum + (o.amount || 0), 0),
    byStatus: orders.reduce((acc: any, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {}),
    byType: orders.reduce((acc: any, o) => {
      acc[o.type] = (acc[o.type] || 0) + 1;
      return acc;
    }, {}),
  };

  res.json({ orders, summary });
});

router.get('/revenue', async (req: AuthRequest, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;
  const where: any = { ...buildDateWhere(startDate as string, endDate as string), status: 'done' };

  const orders = await prisma.order.findMany({ where, orderBy: { createdAt: 'asc' } });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalPaid = orders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);

  const byMonth: Record<string, { revenue: number; paid: number; count: number }> = {};
  orders.forEach((o) => {
    const month = o.createdAt.toISOString().substring(0, 7);
    if (!byMonth[month]) byMonth[month] = { revenue: 0, paid: 0, count: 0 };
    byMonth[month].revenue += o.amount || 0;
    byMonth[month].paid += o.amountPaid || 0;
    byMonth[month].count += 1;
  });

  res.json({ totalRevenue, totalPaid, outstanding: totalRevenue - totalPaid, orderCount: orders.length, byMonth });
});

router.get('/clients', async (_req: AuthRequest, res: Response): Promise<void> => {
  const clients = await prisma.client.findMany({
    include: { orders: { select: { id: true, type: true, status: true, amount: true, createdAt: true } } },
    orderBy: { createdAt: 'desc' },
  });

  const report = clients.map((c) => {
    const sorted = [...c.orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return {
      ...c,
      totalOrders: c.orders.length,
      totalAmount: c.orders.reduce((sum, o) => sum + (o.amount || 0), 0),
      lastOrderDate: sorted[0]?.createdAt || null,
    };
  });

  res.json(report);
});

router.get('/works', async (req: AuthRequest, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;
  const where = buildDateWhere(startDate as string, endDate as string);

  const orders = await prisma.order.findMany({
    where,
    select: { type: true, amount: true, status: true },
  });

  const byType: Record<string, { count: number; amounts: number[]; done: number }> = {};
  orders.forEach((o) => {
    if (!byType[o.type]) byType[o.type] = { count: 0, amounts: [], done: 0 };
    byType[o.type].count++;
    if (o.amount) byType[o.type].amounts.push(o.amount);
    if (o.status === 'done') byType[o.type].done++;
  });

  const total = orders.length;
  const result = Object.entries(byType).map(([type, data]) => ({
    type,
    typeName: TYPE_NAMES[type] || type,
    count: data.count,
    avgAmount: data.amounts.length > 0
      ? Math.round(data.amounts.reduce((a, b) => a + b, 0) / data.amounts.length) : 0,
    totalAmount: data.amounts.reduce((a, b) => a + b, 0),
    doneCount: data.done,
    sharePercent: total > 0 ? Math.round(data.count / total * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  res.json(result);
});

router.get('/workload', async (req: AuthRequest, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;
  const where = buildDateWhere(startDate as string, endDate as string);

  const orders = await prisma.order.findMany({
    where,
    select: { status: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  const inProgressStatuses = new Set(['measuring', 'approval', 'production', 'installation']);
  const byMonth: Record<string, { total: number; new: number; inProgress: number; done: number; cancelled: number }> = {};

  orders.forEach((o) => {
    const month = o.createdAt.toISOString().substring(0, 7);
    if (!byMonth[month]) byMonth[month] = { total: 0, new: 0, inProgress: 0, done: 0, cancelled: 0 };
    byMonth[month].total++;
    if (o.status === 'new') byMonth[month].new++;
    else if (inProgressStatuses.has(o.status)) byMonth[month].inProgress++;
    else if (o.status === 'done') byMonth[month].done++;
    else if (o.status === 'cancelled') byMonth[month].cancelled++;
  });

  const months = Object.entries(byMonth).map(([month, data]) => ({ month, ...data }));
  res.json({ months, totalOrders: orders.length });
});

router.get('/export', async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, format, startDate, endDate, status } = req.query;
  const reportType = (type as string) || 'orders';
  const fileFormat = (format as string) || 'csv';

  let columns: string[] = [];
  let rows: (string | number)[][] = [];
  let title = 'Отчёт';

  const dateWhere = buildDateWhere(startDate as string, endDate as string);

  if (reportType === 'orders') {
    title = 'Отчёт по заказам';
    const where: any = { ...dateWhere };
    if (status && status !== 'all') where.status = status as string;
    const orders = await prisma.order.findMany({
      where, include: { client: true }, orderBy: { createdAt: 'desc' },
    });
    columns = ['Номер', 'Тип работы', 'Клиент', 'Телефон', 'Статус', 'Сумма, ₽', 'Оплачено, ₽', 'Дата'];
    rows = orders.map((o) => [
      o.orderNumber, TYPE_NAMES[o.type] || o.type, o.client.name, o.client.phone,
      STATUS_NAMES[o.status] || o.status, o.amount || 0, o.amountPaid || 0, formatDate(o.createdAt),
    ]);

  } else if (reportType === 'revenue') {
    title = 'Финансовый отчёт';
    const orders = await prisma.order.findMany({
      where: { ...dateWhere, status: 'done' }, orderBy: { createdAt: 'asc' },
    });
    const byMonth: Record<string, { revenue: number; paid: number; count: number }> = {};
    orders.forEach((o) => {
      const month = o.createdAt.toISOString().substring(0, 7);
      if (!byMonth[month]) byMonth[month] = { revenue: 0, paid: 0, count: 0 };
      byMonth[month].revenue += o.amount || 0;
      byMonth[month].paid += o.amountPaid || 0;
      byMonth[month].count++;
    });
    columns = ['Месяц', 'Кол-во заказов', 'Выручка, ₽', 'Оплачено, ₽', 'Долг, ₽'];
    rows = Object.entries(byMonth).map(([month, d]) => [
      month, d.count, d.revenue, d.paid, d.revenue - d.paid,
    ]);

  } else if (reportType === 'clients') {
    title = 'База клиентов';
    const clients = await prisma.client.findMany({
      include: { orders: { select: { amount: true, createdAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
    columns = ['Клиент', 'Телефон', 'Email', 'Заказов', 'Сумма заказов, ₽', 'Последний заказ', 'Дата регистрации'];
    rows = clients.map((c) => {
      const sorted = [...c.orders].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return [
        c.name, c.phone, c.email || '—', c.orders.length,
        c.orders.reduce((s, o) => s + (o.amount || 0), 0),
        formatDate(sorted[0]?.createdAt || null), formatDate(c.createdAt),
      ];
    });

  } else if (reportType === 'works') {
    title = 'Виды работ';
    const orders = await prisma.order.findMany({
      where: dateWhere, select: { type: true, amount: true, status: true },
    });
    const byType: Record<string, { count: number; amounts: number[]; done: number }> = {};
    orders.forEach((o) => {
      if (!byType[o.type]) byType[o.type] = { count: 0, amounts: [], done: 0 };
      byType[o.type].count++;
      if (o.amount) byType[o.type].amounts.push(o.amount);
      if (o.status === 'done') byType[o.type].done++;
    });
    columns = ['Тип работы', 'Кол-во заказов', 'Выполнено', 'Средний чек, ₽', 'Общая сумма, ₽', 'Доля, %'];
    rows = Object.entries(byType)
      .map(([type, d]) => [
        TYPE_NAMES[type] || type, d.count, d.done,
        d.amounts.length > 0 ? Math.round(d.amounts.reduce((a, b) => a + b, 0) / d.amounts.length) : 0,
        d.amounts.reduce((a, b) => a + b, 0),
        orders.length > 0 ? Math.round(d.count / orders.length * 100) : 0,
      ]).sort((a, b) => (b[1] as number) - (a[1] as number));

  } else if (reportType === 'workload') {
    title = 'Загрузка по месяцам';
    const orders = await prisma.order.findMany({
      where: dateWhere, select: { status: true, createdAt: true }, orderBy: { createdAt: 'asc' },
    });
    const inProg = new Set(['measuring', 'approval', 'production', 'installation']);
    const byMonth: Record<string, { total: number; new: number; inProgress: number; done: number; cancelled: number }> = {};
    orders.forEach((o) => {
      const month = o.createdAt.toISOString().substring(0, 7);
      if (!byMonth[month]) byMonth[month] = { total: 0, new: 0, inProgress: 0, done: 0, cancelled: 0 };
      byMonth[month].total++;
      if (o.status === 'new') byMonth[month].new++;
      else if (inProg.has(o.status)) byMonth[month].inProgress++;
      else if (o.status === 'done') byMonth[month].done++;
      else if (o.status === 'cancelled') byMonth[month].cancelled++;
    });
    columns = ['Месяц', 'Всего', 'Новые', 'В работе', 'Выполнено', 'Отменено'];
    rows = Object.entries(byMonth).map(([month, d]) => [
      month, d.total, d.new, d.inProgress, d.done, d.cancelled,
    ]);
  }

  const dateLabel = startDate && endDate
    ? `${startDate} — ${endDate}`
    : new Date().toLocaleDateString('ru-RU');

  if (fileFormat === 'csv') {
    const BOM = '﻿';
    const lines = [columns.join(';'), ...rows.map(r => r.join(';'))];
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}_${Date.now()}.csv"`);
    res.send(BOM + lines.join('\r\n'));

  } else if (fileFormat === 'xlsx') {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Запанков';
    const ws = wb.addWorksheet(title);

    ws.mergeCells(1, 1, 1, columns.length);
    const titleCell = ws.getCell('A1');
    titleCell.value = `${title} | ${dateLabel}`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'left' };

    const headerRow = ws.addRow(columns);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } };
      cell.font = { bold: true, color: { argb: 'FFF0F0FA' } };
      cell.alignment = { horizontal: 'center' };
    });

    rows.forEach((row) => {
      const r = ws.addRow(row);
      r.eachCell((cell, colNum) => {
        if (typeof row[colNum - 1] === 'number') cell.alignment = { horizontal: 'right' };
      });
    });

    ws.columns.forEach((col) => {
      let maxLen = 10;
      col.eachCell?.({ includeEmpty: false }, (cell) => {
        const len = String(cell.value || '').length;
        if (len > maxLen) maxLen = len;
      });
      col.width = Math.min(maxLen + 4, 40);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}_${Date.now()}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();

  } else {
    const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
    doc.registerFont('DejaVu', FONT_PATH);
    doc.font('DejaVu');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}_${Date.now()}.pdf"`);
    doc.pipe(res);

    doc.fontSize(16).text(title, { align: 'left' });
    doc.fontSize(10).fillColor('#888888').text(dateLabel).fillColor('#000000');
    doc.moveDown(0.5);

    const pageWidth = doc.page.width - 80;
    const colWidth = Math.floor(pageWidth / columns.length);
    const rowHeight = 20;
    let y = doc.y;

    doc.fontSize(9).fillColor('#ffffff');
    doc.rect(40, y, pageWidth, rowHeight).fill('#1a1a2e');
    columns.forEach((col, i) => {
      doc.fillColor('#ffffff').text(col, 40 + i * colWidth, y + 5, { width: colWidth - 4, lineBreak: false });
    });
    y += rowHeight;

    doc.fontSize(8).fillColor('#000000');
    rows.forEach((row, ri) => {
      if (y > doc.page.height - 80) { doc.addPage(); y = 40; }
      if (ri % 2 === 0) doc.rect(40, y, pageWidth, rowHeight).fill('#f5f5f5');
      doc.fillColor('#000000');
      row.forEach((cell, i) => {
        doc.text(String(cell), 40 + i * colWidth, y + 4, { width: colWidth - 4, lineBreak: false });
      });
      y += rowHeight;
    });

    doc.fontSize(8).fillColor('#888888')
      .text(`Сформировано: ${new Date().toLocaleString('ru-RU')} | Всего записей: ${rows.length}`,
        40, doc.page.height - 40, { align: 'left' });

    doc.end();
  }
});

export default router;
