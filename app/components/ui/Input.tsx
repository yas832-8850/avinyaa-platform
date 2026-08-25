type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export default function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div>
      {label && <label className="block text-xs uppercase tracking-[0.1em] text-[#8B92A0] mb-2">{label}</label>}
      <input
        className={`w-full border border-[#2C313A] bg-[#15181D] px-3 py-2.5 text-sm text-[#EDEEF0] outline-none transition-colors focus:border-[#F0A83A] placeholder:text-[#565C68] ${className}`}
        {...props}
      />
    </div>
  );
}