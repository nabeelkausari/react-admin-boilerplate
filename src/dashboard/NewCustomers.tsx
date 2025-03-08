import { useState, useEffect } from "react";
import { Avatar, Box, Button } from "@mui/material";
import CustomerIcon from "@mui/icons-material/PersonAdd";
import { Link } from "react-router-dom";
import {
  SimpleList,
  useTranslate,
  useGetList,
} from "react-admin";
import { subDays } from "date-fns";

import CardWithIcon from "./CardWithIcon";
import { Customer } from "../types";

const NewCustomers = () => {
  const translate = useTranslate();
  const [isDataReady, setIsDataReady] = useState(false);
  
  // Use useGetList instead of ListBase for better control
  const { data: customers, isPending, error } = useGetList<Customer>("customers", {
    filter: {
      has_ordered: true,
      first_seen_gte: subDays(new Date(), 30).toISOString(),
    },
    sort: { field: "first_seen", order: "DESC" },
    pagination: { page: 1, perPage: 100 },
  });
  
  // Use useEffect to safely handle data loading state and cleanup
  useEffect(() => {
    if (!isPending && customers && customers.length > 0) {
      setIsDataReady(true);
    }
    
    // Cleanup function to handle component unmounting
    return () => {
      setIsDataReady(false);
    };
  }, [isPending, customers]);

  const aMonthAgo = subDays(new Date(), 30);
  aMonthAgo.setHours(0);
  aMonthAgo.setMinutes(0);
  aMonthAgo.setSeconds(0);
  aMonthAgo.setMilliseconds(0);

  // Only display content when data is ready and not in error state
  const display = !isDataReady || isPending || error ? "none" : "block";
  
  // We don't need aMonthAgo calculation anymore as it's handled in the useGetList filter
  
  return (
    <Box>
      <CardWithIcon
        to="/customers"
        icon={CustomerIcon}
        title={translate("pos.dashboard.new_customers")}
        subtitle={customers ? customers.length : 0}
      >
        <Box sx={{ display }}>
          {customers && (
            <SimpleList<Customer>
              primaryText="%{first_name} %{last_name}"
              leftAvatar={(customer) => (
                <Avatar
                  src={`${customer.avatar}?size=32x32`}
                  alt={`${customer.first_name} ${customer.last_name}`}
                />
              )}
              data={customers}
            />
          )}
          <Box flexGrow={1}>&nbsp;</Box>
          <Button
            sx={{ borderRadius: 0 }}
            component={Link}
            to="/customers"
            size="small"
            color="primary"
          >
            <Box p={1} sx={{ color: "primary.main" }}>
              {translate("pos.dashboard.all_customers")}
            </Box>
          </Button>
        </Box>
      </CardWithIcon>
    </Box>
  );
};

export default NewCustomers;
