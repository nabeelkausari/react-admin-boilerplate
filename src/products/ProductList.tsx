import { Box, Chip, useMediaQuery, Theme } from "@mui/material";
import {
  CreateButton,
  ExportButton,
  FilterButton,
  FilterForm,
  FilterContext,
  InputProps,
  ListBase,
  NumberInput,
  Pagination,
  ReferenceInput,
  SearchInput,
  SelectInput,
  SortButton,
  Title,
  TopToolbar,
  useTranslate,
  useDefaultTitle,
  useListContext,
} from "react-admin";

import ImageList from "./GridList";
import Aside from "./Aside";

const ProductList = () => {
  const isSmall = useMediaQuery<Theme>((theme) => theme.breakpoints.down("md"));
  return (
    <ListBase perPage={24} sort={{ field: "reference", order: "ASC" }}>
      <ProductTitle />
      <FilterContext.Provider value={productFilters}>
        <ListActions isSmall={isSmall} />
        {isSmall && (
          <Box m={1}>
            <FilterForm />
          </Box>
        )}
      </FilterContext.Provider>
      <Box display="flex">
        <Aside />
        <Box width={isSmall ? "auto" : "calc(100% - 16em)"}>
          <ImageList />
          <Pagination rowsPerPageOptions={[12, 24, 48, 72]} />
        </Box>
      </Box>
    </ListBase>
  );
};

const ProductTitle = () => {
  const appTitle = useDefaultTitle();
  const { defaultTitle } = useListContext();

  return (
    <>
      <title>{`${appTitle} - ${defaultTitle}`}</title>
      <Title defaultTitle={defaultTitle} />
    </>
  );
};

const QuickFilter = ({ label }: InputProps) => {
  const translate = useTranslate();
  return <Chip sx={{ mb: 1 }} label={translate(label as string)} />;
};

export const productFilters = [
  <SearchInput key="q" source="q" alwaysOn />,
  <ReferenceInput
    key="category_id"
    source="category_id"
    reference="categories"
    sort={{ field: "id", order: "ASC" }}
  >
    <SelectInput source="name" />
  </ReferenceInput>,
  <NumberInput key="width_gte" source="width_gte" />,
  <NumberInput key="width_lte" source="width_lte" />,
  <NumberInput key="height_gte" source="height_gte" />,
  <NumberInput key="height_lte" source="height_lte" />,
  <QuickFilter
    key="stock_lte"
    label="resources.products.fields.stock_lte"
    source="stock_lte"
    defaultValue={10}
  />,
];

const ListActions = ({ isSmall }: any) => (
  <TopToolbar>
    {isSmall && <FilterButton />}
    <SortButton fields={["reference", "sales", "stock"]} />
    <CreateButton />
    <ExportButton />
  </TopToolbar>
);

export default ProductList;
