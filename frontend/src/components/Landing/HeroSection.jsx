import React from 'react'
import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import { TextEffect } from '../ui/text-effect'
import { AnimatedGroup } from '../ui/animated-group'
import NavbarComponent from '../ui/Navbar'

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring',
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export default function HeroSection() {
    const navigate = useNavigate();

    const handleVendorJoin = () => {
        navigate('/vendor/auth');
    };

    const handleCustomerOrder = () => {
        navigate('/customer/auth');
    };

    return (
        <>
            <NavbarComponent />
            <main className="overflow-hidden">
                <div
                    aria-hidden
                    className="absolute inset-0 isolate hidden contain-strict lg:block">
                    <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
                    <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
                    <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
                </div>
                <section>
                    <div className="relative pt-24">
                        <div className="absolute inset-0 -z-10 size-full bg-gradient-to-b from-transparent to-background/75"></div>
                        <div className="mx-auto max-w-5xl px-6">
                            <div className="sm:mx-auto lg:mr-auto lg:mt-0">
                                <TextEffect
                                    preset="fade-in-blur"
                                    speedSegment={0.3}
                                    as="h1"
                                    className="mt-8 max-w-2xl text-balance text-5xl font-medium md:text-6xl lg:mt-16 text-foreground">
                                    NourishNet - Connecting Hunger with Home-cooked Love
                                </TextEffect>
                                <TextEffect
                                    per="line"
                                    preset="fade-in-blur"
                                    speedSegment={0.3}
                                    delay={0.5}
                                    as="p"
                                    className="mt-8 max-w-2xl text-pretty text-lg text-muted-foreground">
                                    A comprehensive SaaS platform that digitizes tiffin services, optimizes delivery routes with AI, and brings the convenience of home-cooked meals to urban India. Empowering vendors with smart analytics while delighting customers with real-time tracking.
                                </TextEffect>

                                <AnimatedGroup
                                    variants={{
                                        container: {
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.05,
                                                    delayChildren: 0.75,
                                                },
                                            },
                                        },
                                        ...transitionVariants,
                                    }}
                                    className="mt-12 flex items-center gap-2">
                                    <div
                                        key={1}
                                        className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5">
                                        <Button
                                            size="lg"
                                            onClick={handleVendorJoin}
                                            className="rounded-xl px-5 text-base">
                                            <span className="text-nowrap">Join as Vendor</span>
                                        </Button>
                                    </div>
                                    <Button
                                        key={2}
                                        size="lg"
                                        variant="ghost"
                                        onClick={handleCustomerOrder}
                                        className="h-10.5 rounded-xl px-5 text-base">
                                        <span className="text-nowrap">Order Now</span>
                                    </Button>
                                </AnimatedGroup>
                            </div>
                        </div>
                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            staggerChildren: 0.05,
                                            delayChildren: 0.75,
                                        },
                                    },
                                },
                                ...transitionVariants,
                            }}>
                            <div className="mask-b-from-55% relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20">
                                <div className="relative mx-auto max-w-5xl overflow-hidden rounded-2xl border border-border bg-background p-4 shadow-lg ring-1 ring-border">
<img
  className="aspect-15/8 relative hidden rounded-2xl bg-background dark:block"
  src="/Dashboard.png"
  alt="app screen"
/>
<img
  className="aspect-15/8 relative rounded-2xl border border-border/25 dark:hidden"
  src="/Dashboard.png"
  alt="app screen"
/>

                                </div>
                            </div>
                        </AnimatedGroup>
                    </div>
                </section>
                
            </main>
        </>
    )
}