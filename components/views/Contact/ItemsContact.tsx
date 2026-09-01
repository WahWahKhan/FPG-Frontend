import { FiMail, FiPhone } from "react-icons/fi";
import ItemContact from "./ItemContact";

const ItemsContact = () => {
  const contactOptions = [
    {
      label: "General Queries",
      href: "mailto:info@fluidpowergroup.com.au",
      icon: FiMail,
      title: "info@fluidpowergroup.com.au",
    },
    {
      label: "Order Queries",
      href: "mailto:orders@fluidpowergroup.com.au",
      icon: FiMail,
      title: "orders@fluidpowergroup.com.au",
    },
    {
      label: "Sales",
      href: "tel:61409517333",
      icon: FiPhone,
      title: "+61 409 517 333",
    },
  ];

  return (
    <div className="relative">
      
      {/* Middle Layer: Subtle Faded Background Overlay - More contained */}
      <div className="absolute left-0 right-0 bg-gradient-to-br from-white/70 via-gray-50/50 to-white/70 z-10"
           style={{ 
             top: '-2rem', 
             height: 'calc(100% + 4rem)',
             maxHeight: '80vh'
           }}></div>
      
      {/* Top Layer: Contact Items Only */}
      <div className="relative z-20 flex flex-col gap-8 max-w-2xl mx-auto py-8">
        {contactOptions.map((item, i) => (
          <ItemContact key={i} {...item} />
        ))}

        <div className="text-center">
          <h3 className="font-semibold text-gray-800 mb-2">Opening Hours</h3>
          <p className="text-gray-600">Monday - Friday: 8:00am - 5:00pm</p>
          <p className="text-gray-600">Saturday - Sunday: 9:00am - 5:00pm</p>
        </div>
      </div>
    </div>
  );
};

export default ItemsContact;