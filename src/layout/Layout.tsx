import * as React from "react";
import { Layout } from "react-admin";
import AppBar from "./AppBar";
import Menu from "./Menu";

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Layout appBar={AppBar} menu={Menu}>
    {children}
  </Layout>
);

export default AdminLayout;
