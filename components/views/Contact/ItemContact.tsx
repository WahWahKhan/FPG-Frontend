import React, { FC } from "react";
import { FiMail } from "react-icons/fi";

interface IItemContactProps {
  label: string;
  title: string;
  icon: FC<{ className: string }>;
  href: string;
  note?: string;
}

const ItemContact = ({
  title = "Email Address",
  href,
  label,
  icon,
  note
}: IItemContactProps) => {
  return (
    <div className="col-span-6 sm:col-span-3 lg:col-span-2 p-2 sm:p-8  flex gap-4 ">
      <div className="p-5 border text-2xl rounded-2xl">
        {React.createElement(icon)}
      </div>
      <div className="flex flex-col">
        <h3 className="text-xl font-light">{label}</h3>

        <a href={href} target="_blank" rel="noreferrer">
          <h3 className="text-2xl font-light">{title}</h3>
        </a>
        {note && <p className="text-sm text-gray-500 mt-1 max-w-xs">{note}</p>}
      </div>
    </div>
  );
};

export default ItemContact;
