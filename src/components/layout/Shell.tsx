
import React from "react";
import Layout from "@/components/layout/Layout";
import { Analytics } from "@vercel/analytics/react";

interface ShellProps {
  children: React.ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  return (
    <>
      <Layout>{children}</Layout>
      <Analytics />
    </>
  );
};
