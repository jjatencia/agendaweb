import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

const createIcon = (
  paths: React.ReactNode,
  viewBox: string = '0 0 24 24'
): React.FC<IconProps> => ({ size = 20, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox={viewBox}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {paths}
  </svg>
);

export const PhoneIcon = createIcon(
  <path d="M22 16.92V19a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h2.09a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9a16 16 0 006.92 6.92l1.27-.36a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
);

export const ServiceIcon = createIcon(
  <>
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </>
);

export const VariantIcon = createIcon(
  <>
    <path d="M3 7h13l-4-4" />
    <path d="M21 7l-4 4" />
    <path d="M21 17H8l4 4" />
    <path d="M3 17l4-4" />
  </>
);

export const LocationIcon = createIcon(
  <>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </>
);

export const DiscountIcon = createIcon(
  <>
    <line x1="19" y1="5" x2="5" y2="19" />
    <circle cx="6.5" cy="6.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </>
);

export const PaymentIcon = createIcon(
  <>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </>
);

export const CommentIcon = createIcon(
  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
);

export const MailIcon = createIcon(
  <>
    <rect x="3" y="5" width="18" height="14" rx="2" ry="2" />
    <polyline points="3,7 12,13 21,7" />
  </>
);

export const ProfessionalIcon = createIcon(
  <>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </>
);

export const CashIcon = createIcon(
  <>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01M18 12h.01" />
  </>
);

export const CardIcon = createIcon(
  <>
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </>
);

export const WalletIcon = createIcon(
  <>
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </>
);

export const CloseIcon = createIcon(
  <>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </>
);

export const ChevronDownIcon = createIcon(
  <polyline points="6,9 12,15 18,9" />
);

export const ChevronLeftIcon = createIcon(
  <polyline points="15,18 9,12 15,6" />
);

export const ChevronRightIcon = createIcon(
  <polyline points="9,18 15,12 9,6" />
);

export const PlusIcon = createIcon(
  <>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </>
);

export const EuroIcon = createIcon(
  <>
    <path d="M14.5 8.5c-.5-1.5-2-2.5-3.5-2.5-2.5 0-4.5 2-4.5 4.5s2 4.5 4.5 4.5c1.5 0 3-1 3.5-2.5" />
    <line x1="6" y1="10" x2="10" y2="10" />
    <line x1="6" y1="14" x2="10" y2="14" />
  </>
);

export const CheckIcon = createIcon(
  <polyline points="20,6 9,17 4,12" />
);

export const LogoutIcon = createIcon(
  <>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </>
);

export const CardsIcon = createIcon(
  <>
    <rect x="3" y="4" width="18" height="12" rx="2" ry="2" />
    <path d="M8 16h8" />
    <path d="M10 20h4" />
  </>
);

export const DayIcon = createIcon(
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="14" x2="16" y2="14" />
    <line x1="8" y1="18" x2="12" y2="18" />
  </>
);

export const WeekIcon = createIcon(
  <>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
  </>
);

export const ClockIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </>
);
