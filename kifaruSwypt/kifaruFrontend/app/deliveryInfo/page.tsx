"use client";

import React, { use, useEffect,useState} from "react";
import axios from "axios";
import { Sparkles } from "lucide-react";

export default function DeliveryForm() {


const saveDeliveryInfo = (e) => {
  e.preventDefault();
  const formDataZ = new FormData(e.target as HTMLFormElement);

const phone =formDataZ.get("deliveryPhone")?.toString().trim();
const location = formDataZ.get("deliveryLocation")?.toString().trim();
const email = formDataZ.get("deliveryEmail")?.toString().trim();

  if (!phone || !location || !email) {
    alert("Please fill in all fields.");
    return;
  }

  const info = { phone, location, email };
  localStorage.setItem('deliveryInfo', JSON.stringify(info));

try {

    
    
} catch (error) {
    
}

};

  return (
    <main className="bg-gray-100 flex items-center justify-center min-h-screen">
      <form
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md space-y-6"
        method="POST"
        action="/api/submit-delivery" // Optional: Next.js API route
      >
        <h2 className="text-2xl font-bold text-gray-800 text-center">Before you proceed to pay kindly drop your Delivery Info</h2>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-600">
            Phone Number
          </label>
          <input
            type="tel"
            id="deliveryPhone"
            name="deliveryPhone"
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-600">
            Location (Address)
          </label>
          <input
            type="text"
            id="deliveryLocation"
            name="deliveryLocation"
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-600">
            Email Address
          </label>
          <input
            type="email"
            id="deliveryEmail"
            name="deliveryEmail"
            required
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-xl font-semibold hover:bg-blue-700 transition duration-200"
        >
        </button> */}


        <button 
                   onClick={saveDeliveryInfo}
                   className="w-full bg-gradient-to-r from-green-600 via-green-700 to-black text-white py-4 px-6 
                  rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 
                  transform hover:scale-[1.02] hover:-translate-y-1"
                  type="button"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles size={20} />
                     Submit Details
                    <Sparkles size={20} />
                  </span>
                </button>
      </form>
    </main>
  );
}
