
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface NewsPreviewProps {
  title: string;
  date: string;
  category: string;
  excerpt: string;
  featured?: boolean;
}

const NewsPreview = ({ title, date, category, excerpt, featured = false }: NewsPreviewProps) => (
  <Card className={`transition-all ${featured ? 'border-blue-300 shadow-md' : ''}`}>
    <CardHeader className="pb-2">
      <div className="flex justify-between items-start mb-1">
        <Badge variant={category === 'Product News' ? 'default' : category === 'Release Dates' ? 'secondary' : 'outline'}>
          {category}
        </Badge>
        {featured && <Badge className="bg-blue-500">Featured</Badge>}
      </div>
      <CardTitle className="text-xl">{title}</CardTitle>
      <CardDescription className="text-gray-500">{date}</CardDescription>
    </CardHeader>
    <CardContent>
      <p className="text-gray-700">{excerpt}</p>
    </CardContent>
  </Card>
);

export default NewsPreview;
