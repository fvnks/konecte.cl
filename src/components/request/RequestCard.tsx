import Link from 'next/link';
import { SearchRequest } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, MapPin, Tag, DollarSign, SearchIcon } from 'lucide-react';

interface RequestCardProps {
  request: SearchRequest;
}

export default function RequestCard({ request }: RequestCardProps) {
  const {
    title,
    slug,
    desiredLocation,
    desiredCategories,
    author,
    commentsCount,
    budgetMax,
    desiredPropertyType
  } = request;

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-lg">
       <CardHeader className="p-4">
        <div className="flex items-center gap-2 mb-2">
            <Avatar className="h-10 w-10">
              <AvatarImage src={author.avatarUrl} alt={author.name} data-ai-hint="person portrait" />
              <AvatarFallback>{author.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{author.name}</p>
              <p className="text-xs text-muted-foreground">Posted {new Date(request.createdAt).toLocaleDateString()}</p>
            </div>
        </div>
        <Link href={`/requests/${slug}`} className="block">
          <CardTitle className="text-lg font-headline leading-tight hover:text-primary transition-colors">
            <SearchIcon className="inline-block h-5 w-5 mr-2 text-primary align-text-bottom" />
            {title}
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center">
            <MapPin className="mr-1.5 h-4 w-4 text-primary" /> Location: {desiredLocation.city} {desiredLocation.neighborhood ? `(${desiredLocation.neighborhood})` : ''}
          </div>
          {desiredCategories.length > 0 && (
            <div className="flex items-center">
              <Tag className="mr-1.5 h-4 w-4 text-primary" /> Types: {desiredCategories.join(', ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
            </div>
          )}
           {desiredPropertyType.length > 0 && (
            <div className="flex items-center">
              <Tag className="mr-1.5 h-4 w-4 text-primary" /> For: {desiredPropertyType.join(', ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
            </div>
          )}
          {budgetMax && (
             <div className="flex items-center">
              <DollarSign className="mr-1.5 h-4 w-4 text-primary" /> Budget: Up to ${budgetMax.toLocaleString()}
            </div>
          )}
        </div>
        <div className="mt-3">
          {desiredPropertyType.map(pt => (
            <Badge key={pt} variant="secondary" className="mr-1.5 mb-1.5 capitalize">{pt}</Badge>
          ))}
          {desiredCategories.map(cat => (
            <Badge key={cat} variant="outline" className="mr-1.5 mb-1.5 capitalize">{cat}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-end items-center border-t mt-auto">
        <Link href={`/requests/${slug}#comments`} className="flex items-center text-muted-foreground hover:text-primary">
          <Button variant="ghost" size="sm" className="p-1.5 h-auto">
            <MessageCircle className="mr-1 h-4 w-4" />
            <span className="text-xs">{commentsCount} comments</span>
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
