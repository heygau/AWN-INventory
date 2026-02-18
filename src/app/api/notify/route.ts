import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const NAVY = '#1B2B4B';

const resendApiKey = process.env.RESEND_API_KEY;

const resend = resendApiKey ? new Resend(resendApiKey) : null;

type ManagerAlertPayload = {
  type: 'manager_alert';
  to: string;
  employeeName: string;
  items: {
    name: string;
    quantity: number;
    size?: string | null;
  }[];
};

type DispatchedPayload = {
  type: 'dispatched';
  to: string;
  employeeName: string;
  items: {
    name: string;
    quantity: number;
    size?: string | null;
  }[];
};

type LowStockItem = {
  name: string;
  stock_balance: number;
  low_stock_threshold: number | null;
};

type LowStockPayload = {
  type: 'low_stock';
  to: string;
  items: LowStockItem[];
};

type NotifyPayload =
  | ManagerAlertPayload
  | DispatchedPayload
  | LowStockPayload;

const fromAddress = 'noreply@awn.net';

const wrapHtml = (content: string) => `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#F4F6F9;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background-color:#FFFFFF;border-radius:12px;box-shadow:0 4px 18px rgba(0,0,0,0.08);overflow:hidden;">
      <div style="background-color:${NAVY};color:#FFFFFF;padding:16px 20px;display:flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;border-radius:8px;background-color:#FFFFFF;display:flex;align-items:center;justify-content:center;color:${NAVY};font-weight:700;font-size:18px;">
          AWN
        </div>
        <div style="font-size:16px;font-weight:600;">
          AWN Asset Portal
        </div>
      </div>
      <div style="padding:20px 20px 24px 20px;font-size:14px;color:#111827;line-height:1.5;">
        ${content}
      </div>
    </div>
  </div>
`;

const renderItemsList = (
  items: {
    name: string;
    quantity: number;
    size?: string | null;
  }[],
) => {
  if (!items.length) return '<p>No items listed.</p>';

  const rows = items
    .map(
      (item) => `
      <li style="margin-bottom:4px;">
        <span style="font-weight:500;">${item.name}</span>
        <span style="color:#4B5563;"> · Qty ${item.quantity}${
          item.size ? ` · Size ${item.size}` : ''
        }</span>
      </li>
    `,
    )
    .join('');

  return `
    <ul style="padding-left:18px;margin:8px 0 12px 0;">
      ${rows}
    </ul>
  `;
};

const renderLowStockList = (items: LowStockItem[]) => {
  if (!items.length) {
    return '<p>There are currently no low stock items.</p>';
  }

  const rows = items
    .map(
      (item) => `
      <li style="margin-bottom:4px;">
        <span style="font-weight:500;">${item.name}</span>
        <span style="color:#B91C1C;"> · Stock ${item.stock_balance}${
          item.low_stock_threshold !== null
            ? ` (threshold ${item.low_stock_threshold})`
            : ''
        }</span>
      </li>
    `,
    )
    .join('');

  return `
    <ul style="padding-left:18px;margin:8px 0 12px 0;">
      ${rows}
    </ul>
  `;
};

export async function POST(request: Request) {
  if (!resend) {
    return NextResponse.json(
      { error: 'Resend API key not configured.' },
      { status: 500 },
    );
  }

  let payload: NotifyPayload;

  try {
    payload = (await request.json()) as NotifyPayload;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload.' },
      { status: 400 },
    );
  }

  try {
    if (payload.type === 'manager_alert') {
      const itemsHtml = renderItemsList(payload.items);

      const html = wrapHtml(`
        <p style="margin:0 0 12px 0;">Hi,</p>
        <p style="margin:0 0 12px 0;">
          <strong>${payload.employeeName}</strong> has submitted a new asset request that requires your approval.
        </p>
        <p style="margin:0 0 4px 0;font-weight:600;">Items requested:</p>
        ${itemsHtml}
        <p style="margin:0 0 16px 0;">
          You can review and approve this request in the Manager Approvals section of the AWN Asset Portal.
        </p>
        <a
          href="${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/manager/approvals"
          style="display:inline-block;padding:10px 16px;border-radius:999px;background-color:${NAVY};color:#FFFFFF;text-decoration:none;font-weight:600;font-size:14px;"
        >
          Open Manager Approvals
        </a>
      `);

      await resend.emails.send({
        from: fromAddress,
        to: payload.to,
        subject: `Action Required: ${payload.employeeName} submitted a request`,
        html,
      });
    } else if (payload.type === 'dispatched') {
      const itemsHtml = renderItemsList(payload.items);

      const html = wrapHtml(`
        <p style="margin:0 0 12px 0;">Hi ${payload.employeeName},</p>
        <p style="margin:0 0 12px 0;">
          Great news — your AWN asset request has been <strong>dispatched</strong>.
        </p>
        <p style="margin:0 0 4px 0;font-weight:600;">Items dispatched:</p>
        ${itemsHtml}
        <p style="margin:0;">
          If anything looks incorrect, please contact your manager or the AWN admin team.
        </p>
      `);

      await resend.emails.send({
        from: fromAddress,
        to: payload.to,
        subject: 'Your items are on their way!',
        html,
      });
    } else if (payload.type === 'low_stock') {
      const itemsHtml = renderLowStockList(payload.items);

      const html = wrapHtml(`
        <p style="margin:0 0 12px 0;">Hi Admin,</p>
        <p style="margin:0 0 12px 0;">
          The following items in the AWN Asset Portal are currently at or below their low stock thresholds:
        </p>
        ${itemsHtml}
        <p style="margin:0;">
          Please review these items and arrange replenishment as needed.
        </p>
      `);

      await resend.emails.send({
        from: fromAddress,
        to: payload.to,
        subject: 'Low stock alert for AWN assets',
        html,
      });
    } else {
      return NextResponse.json(
        { error: 'Unsupported notification type.' },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Failed to send notification.';

    return NextResponse.json(
      { error: message },
      { status: 500 },
    );
  }
}

