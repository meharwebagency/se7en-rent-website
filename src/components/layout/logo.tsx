import Image from "next/image";
import logoImg from "./logo.png";

export function Logo() {
  return (
    <Image
      src={logoImg}
      alt="Al Zajel Rent Car"
      className="h-8 w-8 object-contain lg:h-10 lg:w-10"
      priority
    />
  );
}
