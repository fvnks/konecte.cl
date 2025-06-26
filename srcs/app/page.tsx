function FeaturedListingsSection({ featuredProperties, recentRequests }: { featuredProperties: PropertyListing[], recentRequests: SearchRequest[] }) {
  return (
    <FeaturedListingsClient featuredProperties={featuredProperties} recentRequests={recentRequests} />
  );
}

return (
  <div className="space-y-12 md:space-y-20">
    <HeroSection />
    
    {sectionsOrder.map(key => {
      const SectionRenderer = sectionComponentsRender[key];
      // Quitamos el div contenedor para que la sección ocupe el ancho completo gestionado por AppLayout
      return SectionRenderer ? <div key={key}>{SectionRenderer()}</div> : null;
    })}
  </div>
); 