
import { Badge } from "@/components/ui/badge";
import { CalendarIcon } from "lucide-react";

interface FeaturedNewsProps {
  title: string;
  date: string;
  category: string;
  content: string;
}

const FeaturedNews = ({ title, date, category, content }: FeaturedNewsProps) => (
  <div className="bg-white rounded-lg shadow-md border border-blue-200 mb-8 overflow-hidden">
    <div className="bg-gradient-to-r from-blue-50 to-white p-1">
      <div className="flex justify-between items-start mb-2 px-5 pt-5">
        <Badge variant="default" className="font-medium">{category}</Badge>
        <Badge className="bg-blue-500 hover:bg-blue-600">Featured Story</Badge>
      </div>
      <h2 className="text-2xl font-bold mb-2 px-6">{title}</h2>
      <div className="flex items-center text-gray-500 mb-4 px-6">
        <CalendarIcon className="h-4 w-4 mr-2" />
        <span>{date}</span>
      </div>
      <div className="prose max-w-none p-6 pt-2 text-gray-700 leading-relaxed">
        <p className="text-gray-700">{content}</p>
      </div>
    </div>
  </div>
);

export default FeaturedNews;
