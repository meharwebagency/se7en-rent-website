import Image from "next/image";
import logoImg from "./logo.png";

export function Logo() {
  return (
    <Image
      src={logoImg}
      alt="Al Zajel Rent Car"
      className="h-10 w-10 object-contain lg:h-12 lg:w-12"
      priority
    />
  );
}
