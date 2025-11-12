import { useState } from 'react'
import { Button, FAQAccordion, FeatureGrid, Footer, Navbar } from './components'
import { Card, CardContent, CardFooter, CardHeader } from './components'
import { AdminApp } from './modules/Admin'
import { VendorApp } from './modules/Vendor'

const features = [
  {
    eyebrow: 'Traceable',
    name: 'Farm-to-Table Transparency',
    summary: 'Know exactly where your produce comes from with verified farm profiles.',
  },
  {
    eyebrow: 'Fresh Logistics',
    name: 'Cold-chain Ready',
    summary: 'Managed transportation ensures freshness and reduces spoilage losses.',
  },
  {
    eyebrow: 'Marketplace',
    name: 'Smart Pricing Engine',
    summary: 'Fair prices backed by real-time demand and supply analytics.',
  },
]

const faqs = [
  {
    question: 'How do farmers join the marketplace?',
    answer:
      'Farmers can apply through our partner program. We provide onboarding assistance, crop quality checks, and digital catalog setup at no additional cost.',
  },
  {
    question: 'Do you manage last-mile delivery?',
    answer:
      'Yes. We coordinate cold-chain logistics with trusted partners to ensure fast, fresh deliveries to retailers, hotels, and processing units.',
  },
  {
    question: 'Can buyers request custom orders?',
    answer:
      'Absolutely. Our procurement specialists help curate bulk or specialized orders, ensuring consistency and quality for large buyers.',
  },
]

function Hero({ onLaunchAdmin, onLaunchVendor }) {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:gap-16">
      <div className="flex-1 space-y-6">
        <span className="badge-brand text-sm">Agriculture Commerce Simplified</span>
        <h1 className="text-4xl font-semibold tracking-tight text-surface-foreground sm:text-5xl">
          Source fresh, sustainable produce directly from trusted farms.
        </h1>
        <p className="max-w-xl text-base text-muted-foreground">
          AgroCart connects buyers and farmers on a transparent marketplace. Discover seasonal harvests, manage logistics,
          and build resilient supply chains with ease.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Button size="lg">Browse Listings</Button>
          <Button variant="outline" size="lg">
            Join as Farmer
          </Button>
          {onLaunchAdmin ? (
            <Button variant="subtle" size="lg" onClick={onLaunchAdmin}>
              Launch Admin Console
            </Button>
          ) : null}
          {onLaunchVendor ? (
            <Button variant="subtle" size="lg" onClick={onLaunchVendor}>
              Launch Vendor App
            </Button>
          ) : null}
        </div>
        <dl className="grid gap-6 pt-6 sm:grid-cols-3">
          {[
            ['12k+', 'Active Farmers'],
            ['48h', 'Average Delivery'],
            ['98%', 'Fulfillment Success'],
          ].map(([stat, label]) => (
            <div key={stat}>
              <dt className="text-sm uppercase text-muted-foreground">{label}</dt>
              <dd className="text-3xl font-semibold text-surface-foreground">{stat}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex flex-1 flex-col gap-4">
        <Card className="bg-white/90">
          <CardHeader
            eyebrow="Today’s Harvest"
            title="Organic Vegetables"
            description="Hand-picked assortment from certified organic farms."
          />
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {[
              ['Baby Spinach', '12 crates • 6kg each'],
              ['Heirloom Tomatoes', '9 crates • 8kg each'],
              ['Rainbow Carrots', '5 crates • 7kg each'],
              ['Sweet Corn', '15 crates • 10kg each'],
            ].map(([name, detail]) => (
              <div key={name} className="rounded-2xl border border-muted/60 bg-brand-soft/40 p-4">
                <p className="text-sm font-semibold text-surface-foreground">{name}</p>
                <p className="text-xs text-muted-foreground">{detail}</p>
              </div>
            ))}
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm">
              <span className="font-semibold text-surface-foreground">Gujarat Collective</span> • Certified Organic
            </p>
            <Button size="sm">Reserve Lot</Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  )
}

function Testimonials() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <header className="mx-auto max-w-2xl space-y-4 text-center">
        <h2 className="text-3xl font-semibold text-surface-foreground">Trusted by growers and buyers alike</h2>
        <p className="text-base text-muted-foreground">
          Our network supports transparent pricing, reliable logistics, and long-term relationships between farms and businesses.
        </p>
      </header>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          {
            name: 'Anjali Patel',
            role: 'Organic Farmer, Gujarat',
            quote:
              'AgroCart helped us access new markets without compromising on fair prices. The logistics support is a game changer.',
          },
          {
            name: 'Rohan Desai',
            role: 'Procurement Lead, FoodCo',
            quote:
              'The platform’s transparency and traceability bring us closer to our sustainability goals. Deliveries are always on time.',
          },
          {
            name: 'Maria Singh',
            role: 'Co-op Manager, Rajasthan',
            quote:
              'With production insights and demand planning, our farmers can plan their planting cycles with confidence.',
          },
        ].map(({ name, role, quote }) => (
          <Card key={name}>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">“{quote}”</p>
              <div>
                <p className="text-sm font-semibold text-surface-foreground">{name}</p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{role}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}

function MarketingExperience({ onLaunchAdmin, onLaunchVendor }) {
  return (
    <>
      <Navbar />
      <main className="space-y-16 pb-20">
        <Hero onLaunchAdmin={onLaunchAdmin} onLaunchVendor={onLaunchVendor} />
        <FeatureGrid
          title="Everything you need for farm-to-market success"
          description="A unified toolkit for procurement teams, farmer collectives, and agri-entrepreneurs to collaborate and scale."
          features={features}
        />
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <h2 className="text-3xl font-semibold text-surface-foreground">Frequently Asked Questions</h2>
              <p className="text-base text-muted-foreground">
                Everything you need to know about partnering with AgroCart, logistics, and procurement support.
              </p>
              <Button variant="link" className="justify-start px-0">
                Still have questions? Contact us
              </Button>
            </div>
            <FAQAccordion items={faqs} />
          </div>
        </section>
        <Testimonials />
      </main>
      <Footer />
    </>
  )
}

function App() {
  const [mode, setMode] = useState('marketing')

  if (mode === 'admin') {
    return <AdminApp onExit={() => setMode('marketing')} />
  }

  if (mode === 'vendor') {
    return <VendorApp />
  }

  return (
    <MarketingExperience
      onLaunchAdmin={() => setMode('admin')}
      onLaunchVendor={() => setMode('vendor')}
    />
  )
}

export default App
