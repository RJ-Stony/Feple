import React from "react";
import { Link } from "react-router-dom";
import {
  SpeakerWaveIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const navItems: NavItem[] = [
  { to: "/upload", label: "상담 파일 업로드", icon: SpeakerWaveIcon },
  { to: "/", label: "대시보드", icon: ChartBarIcon },
  { to: "/sessions", label: "상담 주요 내용", icon: ChatBubbleLeftRightIcon },
  { to: "/diary", label: "코칭 다이어리", icon: PencilSquareIcon },
];

interface SidebarProps {
  isOpen: boolean;
}

export function Sidebar({ isOpen }: SidebarProps) {
  return (
    <aside
      className={`fixed top-16 left-0 bottom-0 w-64 bg-white shadow-lg transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-200 md:translate-x-0`}
    >
      <nav className="mt-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex items-center px-4 py-2 hover:bg-gray-100"
              >
                <item.icon className="w-5 h-5 text-uplus-navy-alt mr-3" />
                <span className="font-text text-uplus-navy">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
