export type PackageTier = 'essential' | 'standard' | 'premium'

export type PackageInclusion = {
  title: string
  description: string
}

export type Package = {
  bhk: '1' | '2' | '3'
  tier: PackageTier
  inclusions: PackageInclusion[]
}

export const packages: Record<'1' | '2' | '3', Record<PackageTier, Package>> = {
  '1': {
    essential: {
      bhk: '1',
      tier: 'essential',
      inclusions: [
        { title: 'Modular Kitchen (Base + Wall Units)', description: '' },
        { title: '1 Master Bedroom (Wardrobe + Loft)', description: '' },
        { title: 'TV Unit', description: '' },
        { title: 'Shoe Rack', description: '' },
        { title: 'False Ceiling (Living Room)', description: '' },
        { title: 'Basic Decorative Lights', description: '' },
        { title: '2D Layouts & 3D Designs', description: '' },
        { title: 'Installation & Project Management', description: '' },
      ],
    },
    standard: {
      bhk: '1',
      tier: 'standard',
      inclusions: [
        { title: 'All in Essential Package', description: '' },
        { title: 'Premium Laminates', description: '' },
        { title: 'Larger Wardrobes', description: '' },
        { title: 'Crockery Unit', description: '' },
        { title: 'Extended TV Unit', description: '' },
        { title: 'Decorative Wall Panel', description: '' },
        { title: 'Premium Lighting', description: '' },
        { title: 'Designer False Ceiling', description: '' },
      ],
    },
    premium: {
      bhk: '1',
      tier: 'premium',
      inclusions: [
        { title: 'All in Standard Package', description: '' },
        { title: 'Acrylic Kitchen', description: '' },
        { title: 'Designer TV Unit', description: '' },
        { title: 'Study Unit', description: '' },
        { title: 'Premium Wall Panelling', description: '' },
        { title: 'Decorative Mirrors', description: '' },
        { title: 'Smart Lighting Options', description: '' },
      ],
    },
  },
  '2': {
    essential: {
      bhk: '2',
      tier: 'essential',
      inclusions: [
        { title: 'Modular Kitchen (Base + Wall Units)', description: '' },
        { title: 'Tall Unit', description: '' },
        { title: 'Cutlery Tray', description: '' },
        { title: 'Tandem Drawers', description: '' },
        { title: 'Master Bedroom (Wardrobe + Loft + Dressing Unit)', description: '' },
        { title: 'Bedroom 2 (Wardrobe + Loft)', description: '' },
        { title: 'TV Unit & Shoe Rack', description: '' },
        { title: 'Dining Wash Counter', description: '' },
        { title: 'False Ceiling (Living Room)', description: '' },
        { title: 'Decorative Lighting', description: '' },
        { title: 'Complete Design & Site Supervision', description: '' },
      ],
    },
    standard: {
      bhk: '2',
      tier: 'standard',
      inclusions: [
        { title: 'All in Essential Package', description: '' },
        { title: 'Premium Kitchen Accessories', description: '' },
        { title: 'Full Height Wardrobes', description: '' },
        { title: 'Crockery Unit', description: '' },
        { title: 'Premium TV Unit', description: '' },
        { title: 'Decorative Wall Panels', description: '' },
        { title: 'Premium False Ceiling', description: '' },
        { title: 'Premium Lighting Package', description: '' },
      ],
    },
    premium: {
      bhk: '2',
      tier: 'premium',
      inclusions: [
        { title: 'All in Standard Package', description: '' },
        { title: 'Acrylic Kitchen', description: '' },
        { title: 'Designer Wardrobes', description: '' },
        { title: 'Pooja Unit', description: '' },
        { title: 'Bar Unit (Optional)', description: '' },
        { title: 'Premium Lighting Package', description: '' },
        { title: 'Premium Hardware', description: '' },
      ],
    },
  },
  '3': {
    essential: {
      bhk: '3',
      tier: 'essential',
      inclusions: [
        { title: 'Full Modular Kitchen (Base + Wall Units)', description: '' },
        { title: 'Tall Unit', description: '' },
        { title: 'Tandem Drawers', description: '' },
        { title: 'Cutlery Accessories', description: '' },
        { title: 'Master Bedroom (Wardrobe + Dressing Unit + Loft)', description: '' },
        { title: 'Bedroom 2 (Wardrobe + Loft)', description: '' },
        { title: 'Bedroom 3 (Wardrobe + Loft)', description: '' },
        { title: 'TV Unit & Shoe Rack', description: '' },
        { title: 'Crockery Unit', description: '' },
        { title: 'Pooja Unit (Standard)', description: '' },
        { title: 'False Ceiling (Living + Dining)', description: '' },
        { title: 'Decorative Lighting', description: '' },
      ],
    },
    standard: {
      bhk: '3',
      tier: 'standard',
      inclusions: [
        { title: 'All in Essential Package', description: '' },
        { title: 'Premium Laminates', description: '' },
        { title: 'Premium Wardrobes', description: '' },
        { title: 'Designer TV Unit', description: '' },
        { title: 'Full Crockery Unit', description: '' },
        { title: 'Decorative Wall Panelling', description: '' },
        { title: 'Premium False Ceiling', description: '' },
        { title: 'Premium Lighting Package', description: '' },
      ],
    },
    premium: {
      bhk: '3',
      tier: 'premium',
      inclusions: [
        { title: 'All in Standard Package', description: '' },
        { title: 'Acrylic Kitchen', description: '' },
        { title: 'Designer Wardrobes', description: '' },
        { title: 'Walk-in Wardrobe Options', description: '' },
        { title: 'Luxury TV Unit', description: '' },
        { title: 'Premium Pooja Unit', description: '' },
        { title: 'Home Office / Study Unit', description: '' },
        { title: 'Designer Wall Paneling', description: '' },
        { title: 'Smart Lighting Options', description: '' },
      ],
    },
  },
}
