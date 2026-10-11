import Pagination from './Pagination';

function DataTablePaginationAdapter({ rowsPerPage, rowCount, currentPage, onChangePage }) {
  return (
    <Pagination
      page={currentPage}
      pageSize={rowsPerPage}
      totalItems={rowCount}
      onPageChange={(nextPage) => onChangePage(nextPage, rowCount)}
    />
  );
}

export default DataTablePaginationAdapter;