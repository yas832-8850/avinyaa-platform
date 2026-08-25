type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export default function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  const base = "px-4 py-2.5 text-sm font-medium transition-opacity disabled:opacity-50";
  const variants = {
    primary: "bg-[#F0A83A] text-[#15181D] hover:opacity-90",
    secondary: "border border-[#2C313A] bg-transparent text-[#EDEEF0] hover:bg-[#1E2229]",
    danger: "border border-[#3A2222] bg-transparent text-[#E08080] hover:bg-[#221818]",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}