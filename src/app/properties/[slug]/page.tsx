import { sampleProperties, placeholderUser, Comment as CommentType } from "@/lib/types";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, BedDouble, Bath, HomeIcon, Tag, ThumbsUp, MessageSquare, Send, UserCircle } from "lucide-react";
import Link from "next/link";

// Placeholder for actual data fetching
async function getPropertyData(slug: string) {
  return sampleProperties.find(p => p.slug === slug) || sampleProperties[0];
}

// Placeholder for comments
const sampleComments: CommentType[] = [
  { id: 'comment1', content: 'This looks like a great place! Is it near public transport?', author: placeholderUser, createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString(), upvotes: 5 },
  { id: 'comment2', content: 'What are the HOA fees like?', author: {id: 'user4', name: 'Bob Johnson', avatarUrl: 'https://placehold.co/40x40.png?text=BJ'}, createdAt: new Date(Date.now() - 86400000 * 0.2).toISOString(), upvotes: 2 },
];


export default async function PropertyDetailPage({ params }: { params: { slug: string } }) {
  const property = await getPropertyData(params.slug);

  if (!property) {
    return <div className="text-center py-10">Property not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="overflow-hidden">
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={property.images[0] || 'https://placehold.co/800x450.png'}
            alt={property.title}
            fill
            className="object-cover"
            priority
            data-ai-hint="modern apartment"
          />
           <Badge variant="secondary" className="absolute top-4 left-4 text-sm py-1 px-3 capitalize shadow-md">
            For {property.propertyType}
          </Badge>
        </div>
        <CardHeader className="p-6">
          <CardTitle className="text-3xl font-headline">{property.title}</CardTitle>
          <div className="flex items-center text-muted-foreground mt-2">
            <MapPin className="mr-2 h-5 w-5" />
            <span>{property.address}, {property.city}, {property.country}</span>
          </div>
           <div className="mt-2 text-3xl font-bold text-primary">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: property.currency }).format(property.price)}
            {property.propertyType === 'rent' && <span className="text-lg font-normal text-muted-foreground">/month</span>}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-secondary rounded-lg">
              <BedDouble className="mx-auto mb-1 h-6 w-6 text-primary" />
              <p className="font-medium">{property.bedrooms} Bedrooms</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <Bath className="mx-auto mb-1 h-6 w-6 text-primary" />
              <p className="font-medium">{property.bathrooms} Bathrooms</p>
            </div>
             <div className="p-3 bg-secondary rounded-lg">
              <HomeIcon className="mx-auto mb-1 h-6 w-6 text-primary" />
              <p className="font-medium">{property.areaSqMeters} m²</p>
            </div>
            <div className="p-3 bg-secondary rounded-lg">
              <Tag className="mx-auto mb-1 h-6 w-6 text-primary" />
              <p className="font-medium capitalize">{property.category}</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold mb-2 font-headline">Description</h3>
            <p className="text-muted-foreground whitespace-pre-line">{property.description}</p>
          </div>

          {property.features && property.features.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold mb-2 font-headline">Features</h3>
              <ul className="grid grid-cols-2 md:grid-cols-3 gap-2 list-inside">
                {property.features.map(feature => (
                  <li key={feature} className="flex items-center text-muted-foreground">
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2 mr-2 text-primary"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="text-xl font-semibold mb-2 font-headline">Listed By</h3>
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={property.author.avatarUrl} alt={property.author.name} />
                <AvatarFallback>{property.author.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{property.author.name}</p>
                <p className="text-xs text-muted-foreground">Joined {new Date(property.createdAt).toLocaleDateString() /* Assuming author join date is same as property for placeholder */}</p>
              </div>
              <Button variant="outline" className="ml-auto">Contact Lister</Button>
            </div>
          </div>
          
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card id="comments">
        <CardHeader>
          <CardTitle className="text-2xl font-headline flex items-center">
            <MessageSquare className="mr-3 h-7 w-7 text-primary"/> Discussions ({sampleComments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Comment Form */}
          <div className="flex gap-3 items-start">
            <Avatar className="mt-1">
              <AvatarImage src={placeholderUser.avatarUrl} />
              <AvatarFallback><UserCircle /></AvatarFallback>
            </Avatar>
            <div className="flex-grow space-y-2">
              <Textarea placeholder="Add a public comment..." className="min-h-[80px]" />
              <Button className="flex items-center gap-2">
                <Send className="h-4 w-4"/> Post Comment
              </Button>
            </div>
          </div>

          {/* Comment List */}
          <div className="space-y-4">
            {sampleComments.map(comment => (
              <div key={comment.id} className="flex gap-3 items-start p-4 bg-secondary/50 rounded-lg">
                <Avatar>
                  <AvatarImage src={comment.author.avatarUrl} alt={comment.author.name} />
                  <AvatarFallback>{comment.author.name?.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-grow">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{comment.author.name}</span>
                    <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm mt-1">{comment.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="ghost" size="sm" className="text-xs p-1 h-auto text-muted-foreground hover:text-primary">
                      <ThumbsUp className="h-3.5 w-3.5 mr-1" /> {comment.upvotes}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-xs p-1 h-auto text-muted-foreground">Reply</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
           {sampleComments.length === 0 && <p className="text-muted-foreground text-center py-4">No comments yet. Be the first to discuss!</p>}
        </CardContent>
      </Card>
    </div>
  );
}
