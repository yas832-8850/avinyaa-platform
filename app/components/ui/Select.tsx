type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
};

export default function Select({ label, className = "", children, ...props }: SelectProps) {
  return (
    <div>
      {label && <label className="block text-xs uppercase tracking-[0.1em] text-[#8B92A0] mb-2">{label}</label>}
      <select
        className={`w-full border border-[#2C313A] bg-[#15181D] px-3 py-2.5 text-sm text-[#EDEEF0] outline-none transition-colors focus:border-[#F0A83A] ${className}`}
        {...props}
      >
        {children}
      </select>
    </div>
  );
}