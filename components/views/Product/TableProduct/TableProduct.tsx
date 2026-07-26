import Counter from "@/modules/Counter";
import { IItemCart } from "types/cart";
import { useState, useEffect } from "react";

type ITableProductProps = {
  items: IItemCart[];
  setItems: (val: any) => void;
};

const formathead = (title: string) => {
  const stringElements = title.split("_");
  if (stringElements.length === 1) {
    return `${title.charAt(0).toUpperCase()}${title.slice(1)}`;
  }
  let string = "";
  stringElements.forEach((word, i) => {
    if (i !== stringElements.length - 1) {
      if (word === "id" || word == "od") {
        string =
          string +
          word.split("")[0].toUpperCase() +
          "." +
          word.split("")[1].toUpperCase() +
          " ";
      } else {
        string = string + word.charAt(0).toUpperCase() + word.slice(1) + " ";
      }
    } else {
      if (word === "id" || word == "od") {
        string =
          string +
          word.split("")[0].toUpperCase() +
          "." +
          word.split("")[1].toUpperCase();
      } else if (word.length === 1) {
        string = string + '"' + word.toUpperCase() + '"';
      } else {
        string = string + "(" + word + ")";
      }
    }
  });
  return string;
};

const TableProduct = ({ items, setItems }: ITableProductProps) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="wrapper px-8 md:px-12">
      <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: '600px' }}>
        <div 
          className="relative rounded-2xl overflow-hidden min-w-fit"
          style={{
            background: `
              linear-gradient(90deg, 
                rgba(250, 204, 21, 0.1) 0%, 
                rgba(250, 204, 21, 0.05) 30%, 
                rgba(250, 204, 21, 0.02) 50%, 
                transparent 50%
              ),
              rgba(255, 255, 255, 0.8)
            `,
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            boxShadow: `
              0 8px 32px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.4),
              inset 0 -1px 0 rgba(0, 0, 0, 0.05)
            `
          }}
        >
          <table className="table-auto w-full select-none">
            <thead>
              <tr className="text-xl bg-[#191919] text-yellow-400 text-left">
                <th className="font-semibold py-2">Part Number</th>
                {Object.entries(items[0].attributes).map(([key, value]) => (
                  <th className="font-semibold " key={key}>
                    {formathead(key)}
                  </th>
                ))}
                <th className="font-semibold ">Price</th>
                <th className="font-semibold text-center w-24">Stock</th>
                {/* Order Qty — the "action" column: inverted yellow header + a
                    divider so it reads as separate from the spec/data columns. */}
                <th className="bg-yellow-400 text-[#191919] text-center rounded-t-xl border-l-4 border-white/60 px-4">
                  <div className="leading-tight">Order Qty</div>
                  <div className="text-xs font-normal opacity-80">Tap +/- to add</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr 
                  className="group transition-all duration-300 ease-out"
                  key={item.id}
                  style={{
                    background: "transparent"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `
                      radial-gradient(ellipse at center, rgba(250, 204, 21, 0.9) 20%, rgba(250, 204, 21, 0.7) 60%, rgba(255, 215, 0, 0.8) 100%), 
                      rgba(250, 204, 21, 0.6)
                    `;
                    e.currentTarget.style.setProperty('backdrop-filter', 'blur(15px)');
                    e.currentTarget.style.border = "1px solid rgba(255, 215, 0, 0.9)";
                    e.currentTarget.style.borderRadius = "12px";
                    e.currentTarget.style.boxShadow = `
                      0 10px 30px rgba(250, 204, 21, 0.6),
                      inset 0 2px 0 rgba(255, 255, 255, 0.8),
                      inset 0 3px 10px rgba(255, 255, 255, 0.4),
                      inset 0 -1px 0 rgba(255, 215, 0, 0.4)
                    `;
                    e.currentTarget.style.transform = "translateY(-2px) scale(1.01)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.setProperty('backdrop-filter', 'none');
                    e.currentTarget.style.border = "none";
                    e.currentTarget.style.borderRadius = "0";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                  }}
                >
                  <td className="whitespace-nowrap font-bold">{item.name}</td>
                  {Object.entries(item.attributes).map(([key, value]) => {
                    if (typeof value === "string") {
                      return (
                        <td className="whitespace-nowrap" key={key}>
                          {value}
                        </td>
                      );
                    } else {
                      return (
                        <td className="whitespace-nowrap  " key={key}>
                          {"-"}
                        </td>
                      );
                    }
                  })}
                  <td className="font-bold">{`$${item.price}`}</td>
                  <td className="text-center w-24 text-gray-600">{item.stock}</td>
                  <td className="w-32 border-l-4 border-yellow-400/40">
                    <div className="flex justify-center">
                      {item.stock === 0 ? (
                        <span className="font-semibold text-red-600">Sold Out</span>
                      ) : (
                        <Counter
                          limit={item.stock}
                          count={item.quantity}
                          setCount={(val: number) => {
                            setItems(
                              items.map((itemToAdd) =>
                                itemToAdd.id === item.id
                                  ? { ...item, quantity: val }
                                  : itemToAdd
                              )
                            );
                          }}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TableProduct;