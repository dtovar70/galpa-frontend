import { BrandsStrip } from '@/views/home/components/BrandsStrip'
import { BtuCalculator } from '@/views/home/components/BtuCalculator'
import { CategoryStrip } from '@/views/home/components/CategoryStrip'
import { CtaBanner } from '@/views/home/components/CtaBanner'
import { FeaturedProducts } from '@/views/home/components/FeaturedProducts'
import { Hero } from '@/views/home/components/Hero'
import { Testimonials } from '@/views/home/components/Testimonials'
import { WhyChooseUs } from '@/views/home/components/WhyChooseUs'

export function HomeView() {
    return (
        <>
            <Hero />
            <CategoryStrip />
            <FeaturedProducts />
            <BtuCalculator />
            <WhyChooseUs />
            <BrandsStrip />
            <Testimonials />
            <CtaBanner />
        </>
    )
}
