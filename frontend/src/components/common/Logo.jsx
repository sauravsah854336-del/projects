import { Link } from "react-router-dom";
import { BRAND } from "../../config/brand";

const Logo = ({ variant = "full", size = "md", linkTo = "/", className = "" }) => {
  const sizes = {
    sm: { img: "h-8 w-8", text: "text-lg", tagline: "text-[9px]" },
    md: { img: "h-10 w-10", text: "text-xl", tagline: "text-[10px]" },
    lg: { img: "h-14 w-14", text: "text-2xl", tagline: "text-xs" },
    xl: { img: "h-20 w-20", text: "text-3xl", tagline: "text-sm" },
  };

  const s = sizes[size];

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`${s.img} rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-brand-primary/10 shadow-sm`}>
        <img
          src={BRAND.logo}
          alt={BRAND.name}
          className="w-full h-full object-cover"
        />
      </div>

      {variant === "full" && (
        <div className="flex flex-col leading-tight">
          <span className={`${s.text} font-display font-bold text-brand-primary tracking-tight`}>
            shop<span className="text-brand-accent">.</span>design
          </span>
          {size !== "sm" && (
            <span className={`${s.tagline} text-brand-text-light uppercase tracking-wider font-medium`}>
              {BRAND.tagline}
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }

  return content;
};

export default Logo;