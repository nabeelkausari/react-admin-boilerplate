import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import CommentIcon from "@mui/icons-material/Comment";
import { Link } from "react-router-dom";

import {
  ReferenceField,
  FunctionField,
  useGetList,
  useTranslate,
} from "react-admin";

import { stringify } from "query-string";

import CardWithIcon from "./CardWithIcon";
// import StarRatingField from "../reviews/StarRatingField";
import { Customer, Review } from "../types";

const PendingReviews = () => {
  const translate = useTranslate();
  const [isDataReady, setIsDataReady] = useState(false);
  const {
    data: reviews,
    total,
    isPending,
    error,
  } = useGetList<Review>("reviews", {
    filter: { status: "pending" },
    sort: { field: "date", order: "DESC" },
    pagination: { page: 1, perPage: 100 },
  });

  // Use useEffect to safely handle data loading state and cleanup
  useEffect(() => {
    // Only set data as ready when we have reviews and they're not pending
    if (!isPending && reviews && reviews.length > 0) {
      setIsDataReady(true);
    }
    
    // Cleanup function to handle component unmounting
    return () => {
      // This cleanup function will run when the component unmounts
      // or before the effect runs again, preventing memory leaks
      setIsDataReady(false);
    };
  }, [isPending, reviews]);

  // Only display content when data is ready and not in error state
  const display = !isDataReady || isPending || error ? "none" : "block";

  return (
    <CardWithIcon
      to={{
        pathname: "/reviews",
        search: stringify({
          filter: JSON.stringify({ status: "pending" }),
        }),
      }}
      icon={CommentIcon}
      title={translate("pos.dashboard.pending_reviews")}
      subtitle={total}
    >
      <List sx={{ display }}>
        {reviews?.map((record: Review) => (
          <ListItem key={record.id} disablePadding>
            <ListItemButton
              alignItems="flex-start"
              component={Link}
              to={`/reviews/${record.id}`}
            >
              <ListItemAvatar>
                <ReferenceField
                  record={record}
                  source="customer_id"
                  reference="customers"
                  link={false}
                >
                  <FunctionField<Customer>
                    render={(customer) => (
                      <Avatar
                        src={`${customer.avatar}?size=32x32`}
                        sx={{
                          bgcolor: "background.paper",
                        }}
                        alt={`${customer.first_name} ${customer.last_name}`}
                      />
                    )}
                  />
                </ReferenceField>
              </ListItemAvatar>

              <ListItemText
                // primary={<StarRatingField record={record} source="rating" />}
                secondary={record.comment}
                sx={{
                  overflowY: "hidden",
                  height: "4em",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  paddingRight: 0,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Box flexGrow={1}>&nbsp;</Box>
      <Button
        sx={{ borderRadius: 0 }}
        component={Link}
        to="/reviews"
        size="small"
        color="primary"
      >
        <Box p={1} sx={{ color: "primary.main" }}>
          {translate("pos.dashboard.all_reviews")}
        </Box>
      </Button>
    </CardWithIcon>
  );
};

export default PendingReviews;
