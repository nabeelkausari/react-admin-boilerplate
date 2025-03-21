import { Link, FieldProps, useRecordContext } from "react-admin";

import FullNameField from "./FullNameField";
import { Customer } from "../types";

const CustomerLinkField = (_: FieldProps<Customer>) => {
  const record = useRecordContext<Customer>();
  if (!record) {
    return null;
  }
  return (
    <Link to={`/customers/${record.id}`}>
      <FullNameField source="last_name" />
    </Link>
  );
};

export default CustomerLinkField;
