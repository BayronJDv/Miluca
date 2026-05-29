import React from 'react';
import { colors } from "./colors";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: colors.onSurface, letterSpacing: "-0.02em" }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 14, color: colors.secondary, marginTop: 2 }}>{subtitle}</p>}
    </div>
    {actions && <div style={{ display: "flex", gap: 8 }}>{actions}</div>}
  </div>
);

export default PageHeader;