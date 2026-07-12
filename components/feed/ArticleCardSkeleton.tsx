import Card from "@/components/UI/Card/Card";
import Skeleton from "@/components/UI/Skeleton/Skeleton";

/**
 * One placeholder card, shaped like ArticleCard. It does **not** own a grid —
 * ArticleList does, so the loading and loaded states cannot drift out of
 * alignment and make the layout jump.
 */
const ArticleCardSkeleton = () => {
  return (
    <Card padding="none" className="overflow-hidden">
      <Skeleton shape="block" className="h-40 rounded-none" />

      <div className="flex flex-col gap-3 p-4">
        <Skeleton shape="text" className="w-24" />
        <Skeleton shape="text" lines={2} />
        <Skeleton shape="text" className="w-32" />
      </div>
    </Card>
  );
};

export default ArticleCardSkeleton;
