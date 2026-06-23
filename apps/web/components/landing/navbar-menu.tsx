"use client";

import {
  NavbarWithMenu,
  type NavMenuSection,
} from "@/components/landing/navbar-with-menu";

const sections: NavMenuSection[] = [
  {
    id: "studio",
    label: "Studio",
    href: "/studio",
  },
];

export default function NavbarMenuFull() {
  return <NavbarWithMenu sections={sections} />;
}
