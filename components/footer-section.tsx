import Link from 'next/link'
import { FOOTER, SITE_CONFIG } from '@/lib/constants/landing-content'

export default function FooterSection() {
  return (
    <div className="w-full pt-10 flex flex-col justify-start items-start">
      {/* Main Footer Content */}
      <div className="self-stretch h-auto flex flex-col md:flex-row justify-between items-stretch pr-0 pb-8 pt-0">
        <div className="h-auto p-4 md:p-8 flex flex-col justify-start items-start gap-8">
          {/* Brand Section */}
          <div className="self-stretch flex justify-start items-center gap-3">
            <div className="text-center text-[#49423D] text-xl font-semibold leading-4 font-sans">
              {SITE_CONFIG.name}
            </div>
          </div>
          <div className="text-[rgba(73,66,61,0.90)] text-sm font-medium leading-[18px] font-sans">
            {FOOTER.brand.tagline}
          </div>

          {/* Social Media Icons */}
          <div className="flex justify-start items-start gap-4">
            {/* Twitter/X Icon */}
            {FOOTER.socialLinks.twitter && (
              <Link
                href={FOOTER.socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="w-6 h-6 relative overflow-hidden hover:opacity-70 transition-opacity"
                aria-label="Follow us on X (Twitter)"
              >
                <div className="w-6 h-6 left-0 top-0 absolute flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
                      fill="#49423D"
                    />
                  </svg>
                </div>
              </Link>
            )}

            {/* LinkedIn Icon */}
            {FOOTER.socialLinks.linkedin && (
              <Link
                href={FOOTER.socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="w-6 h-6 relative overflow-hidden hover:opacity-70 transition-opacity"
                aria-label="Follow us on LinkedIn"
              >
                <div className="w-6 h-6 left-0 top-0 absolute flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"
                      fill="#49423D"
                    />
                  </svg>
                </div>
              </Link>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <div className="self-stretch p-4 md:p-8 flex flex-col sm:flex-row flex-wrap justify-start sm:justify-between items-start gap-6 md:gap-8">
          {FOOTER.columns.map((column) => (
            <div key={column.title} className="flex flex-col justify-start items-start gap-3 flex-1 min-w-[120px]">
              <div className="self-stretch text-[rgba(73,66,61,0.50)] text-sm font-medium leading-5 font-sans">
                {column.title}
              </div>
              <div className="flex flex-col justify-end items-start gap-2">
                {column.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-[#49423D] text-sm font-normal leading-5 font-sans hover:text-[#37322F] transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Copyright Section */}
      <div className="self-stretch px-4 md:px-8 py-4 border-t border-[rgba(55,50,47,0.12)]">
        <div className="text-[rgba(73,66,61,0.60)] text-xs font-normal leading-4 font-sans text-center md:text-left">
          {FOOTER.copyright}
        </div>
      </div>

      {/* Bottom Section with Pattern */}
      <div className="self-stretch h-12 relative overflow-hidden border-t border-b border-[rgba(55,50,47,0.12)]">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="w-full h-full relative">
            {Array.from({ length: 400 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-[300px] h-16 border border-[rgba(3,7,18,0.08)]"
                style={{
                  left: `${i * 300 - 600}px`,
                  top: "-120px",
                  transform: "rotate(-45deg)",
                  transformOrigin: "top left",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
