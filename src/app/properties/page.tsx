// src/app/properties/page.tsx
import PropertyCard from "@/components/property/PropertyCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { sampleProperties } from "@/lib/types"; // Using placeholder data
import { Filter, ListFilter, Search } from "lucide-react";
import Link from "next/link";

export default function PropertiesPage() {
  // In a real app, fetch and filter this data
  const properties = sampleProperties;

  return (
    <div className="space-y-8">
      <section className="flex flex-col md:flex-row justify-between items-center gap-4 p-6 bg-card rounded-lg shadow">
        <div>
          <h1 className="text-3xl font-headline font-bold">Properties</h1>
          <p className="text-muted-foreground">Browse all available properties for rent or sale.</p>
        </div>
        <Button asChild>
          <Link href="/properties/submit">List Your Property</Link>
        </Button>
      </section>

      <div className="p-4 bg-card rounded-lg shadow space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input type="search" placeholder="Search by location, title, features..." className="pl-10 w-full" />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </Button>
           <Select defaultValue="latest">
            <SelectTrigger className="w-full md:w-[180px]">
              <ListFilter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Placeholder for advanced filters */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <Select placeholder="Type (Rent/Sale)" />
          <Select placeholder="Category" />
          <Input type="number" placeholder="Min. Bedrooms" />
          <Input type="number" placeholder="Max. Price" />
        </div> */}
      </div>
      
      {properties.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 xl:gap-x-8">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-xl font-semibold">No Properties Found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filters. Or, be the first to list one!
          </p>
          <Button className="mt-6" asChild>
            <Link href="/properties/submit">List a Property</Link>
          </Button>
        </div>
      )}
       {/* Pagination Placeholder */}
      <div className="flex justify-center mt-8">
        <Button variant="outline" className="mr-2" disabled>Previous</Button>
        <Button variant="outline">Next</Button>
      </div>
    </div>
  );
}
