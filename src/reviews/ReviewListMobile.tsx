import { List } from "@mui/material";
import { RecordContextProvider, useListContext } from "react-admin";

import { ReviewItem } from "./ReviewItem";
import { Review } from "./../types";

const ReviewListMobile = () => {
  const { data, error, isPending, total } = useListContext<Review>();
  if (isPending || error || Number(total) === 0) {
    return null;
  }
  return (
    <List sx={{ width: "calc(100vw - 33px)" }}>
      {data.map((review) => (
        <RecordContextProvider value={review} key={review.id}>
          <ReviewItem />
        </RecordContextProvider>
      ))}
    </List>
  );
};

export default ReviewListMobile;
