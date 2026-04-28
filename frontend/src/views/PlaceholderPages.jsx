import React from 'react';

const PlaceholderPage = ({ title }) => (
  <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 min-h-[400px] flex flex-col items-center justify-center text-center">
    <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4">
      <span className="text-2xl italic font-serif leading-none">?</span>
    </div>
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
    <p className="text-gray-500 mt-2 max-w-sm">
      We are currently building the <span className="font-semibold">{title}</span> module. 
      This feature will be available in the next update.
    </p>
    <button className="mt-8 px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors">
      Go back to Dashboard
    </button>
  </div>
);

export const CompaniesPage = () => <PlaceholderPage title="Company Management" />;
export const ProjectsPage = () => <PlaceholderPage title="Project Tracking" />;
export const SalesPage = () => <PlaceholderPage title="Sales Pipeline" />;
export const LeadsPage = () => <PlaceholderPage title="Leads & Opportunities" />;
export const ClientsPage = () => <PlaceholderPage title="Client Management" />;
export const BillingPage = () => <PlaceholderPage title="Billing & Invoices" />;
export const SettingsPage = () => <PlaceholderPage title="Global Settings" />;
export const TeamPage = () => <PlaceholderPage title="Team Management" />;
