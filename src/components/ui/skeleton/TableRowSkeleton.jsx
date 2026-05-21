import Skeleton from "./Skeleton";

const TableRowSkeleton = () => {
  return (
    <div className="grid grid-cols-4 gap-4 py-4 items-center">

      <Skeleton className="h-4 w-3/4" />

      <Skeleton className="h-4 w-1/2" />

      <Skeleton className="h-4 w-2/3" />

      <Skeleton className="h-8 w-20 rounded-lg" />

    </div>
  );
};

export default TableRowSkeleton;