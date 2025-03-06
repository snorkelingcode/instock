
import { Badge } from "@/components/ui/badge";

interface FeaturedNewsProps {
  title: string;
  date: string;
  category: string;
  content: string;
}

const FeaturedNews = ({ title, date, category, content }: FeaturedNewsProps) => (
  <div className="bg-white rounded-lg shadow-md border border-blue-200 mb-8">
    <div className="p-6">
      <div className="flex justify-between items-start mb-2">
        <Badge variant="default">{category}</Badge>
        <Badge className="bg-blue-500">Featured Story</Badge>
      </div>
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-gray-500 mb-4">{date}</p>
      <div className="prose max-w-none">
        <p className="text-gray-700">{content}</p>
      </div>
    </div>
  </div>
);

export default FeaturedNews;
