import React, { useEffect, useState } from "react";
import { deleteApiWithToken, getApiWithToken, postApiWithToken } from "../../api/api";
import { toastError, toastSuccess } from "../../utils/notifyCustom";
import { useQuery } from "@tanstack/react-query";


const NomineeSection = () => {
  // nominee data stored in object (easy to send to backend)
  const [nominee, setNominee] = useState({
    name: "",
    relation: "",
    dob: "",
    // mobile: "",
    // email: "",
    percentage: "",
    id: "",
    // address: "",
    // pincode: "",
    // isMinor: "no",
    // guardianName: "",
    // guardianRelation: "",
  });

  // const [nominees, setNomineese] = useState([])
  const [editNominee, setEditNominee] = useState([])


const fetchNominee = async () => {
  const url = `${import.meta.env.VITE_URL}/kyc/get-nominees`;
  const res = await getApiWithToken(url);

  if (res?.status !== 200) {
    throw new Error('Failed to fetch nominees');
  }

  return res?.data?.data;
};

const { data: nominees, error, isLoading, refetch } = useQuery({
  queryKey: ['nominees'],
  queryFn: fetchNominee,
});

  // check if nominee already added
  const [nomineeAdded, setNomineeAdded] = useState(true);

  // for showing add/edit form
  const [showForm, setShowForm] = useState(false);

  // FAQ open state
  const [openFAQ, setOpenFAQ] = useState(null);

  const faqs = [
    { q: "Why should I add a nominee?", a: "Nominee ensures your investments transfer smoothly in case of emergency." },
    { q: "Who can be a nominee?", a: "Any family member including spouse, children, parents, or siblings." },
    { q: "Can I add multiple nominees?", a: "Yes you can add up to 3 nominees with percentage allocation." },
    { q: "Do I need KYC to add a nominee?", a: "Yes, nominee addition is only allowed after full KYC completion." },
    { q: "Can I change nominee later?", a: "Yes, nominee details can be updated anytime"},
    { q: "What if my nominee is a minor?", a: "You must add a guardian who will manage investments until they become adult." },
    { q: "Why is a guardian required?", a: "A guardian is required if the nominee is below 18 years." },
    { q: "What is allocation percentage?", a: "It defines how much share (in %) the nominee will receive." },
    { q: "Does the nominee need an Aadhaar/PAN?", a: "Not mandatory while adding, but may be required during claim"},
    { q: "Is nominee mandatory?", a: "Not mandatory, but strongly recommended for smooth claim settlement." },
    { q: "Does nominee need to be KYC verified?", a: "Usually no, only basic details are required." },
    { q: "Can my friend be a nominee?", a:"Only if legally valid with supporting relationship documents"},
    { q: "How to add nominee?", a: "By clicking on add button and fill all required details you can add nominee"}

  ];


  const handleChange = (field, value) => {
    setNominee((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (id) => {
    // you can send "nominee" object to backend directly
    // console.log("Final Nominee Data Sent to Backend:", nominee);

      const editUrl = `${import.meta.env.VITE_URL}/kyc/update-nominee/${id}`
    const addUrl = `${import.meta.env.VITE_URL}/kyc/nominee`
    
    const url = nomineeAdded ? editUrl : addUrl

      try{
        const res = await postApiWithToken(url, nominee)
        console.log("Nominee update", res);
        if (res?.status === 200 || res?.status === true) {
          setNomineeAdded(true);
          setShowForm(false);
          toastSuccess(res?.message)
          refetch()
        }
        
      }catch(err){
        toastError(err?.message);
        
      }

  };

  const handleDeleteNominee = async (id) => {
    const url = `${import.meta.env.VITE_URL}/kyc/delete-nominee/${id}`

      try{
        const res = await deleteApiWithToken(url)
        console.log("Nominee delete", res);
        if (res?.status === 200) {
          toastSuccess(res?.data?.message)
          refetch()
        }
        
      }catch(err){
        toastError(err?.message);
        
      }
  }
  const fetchNomineeById = async (id) => {
    const url = `${import.meta.env.VITE_URL}/kyc/get-nominee/${id}`;

    try {
      const res = await getApiWithToken(url);
      console.log("Edit Nominee", res);
      if (res?.status === 200) {
        setNominee(prev => ({
  ...prev,
  ...res?.data?.data,
}));
      }
    } catch (err) {
      toastError(err?.message);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto relative overflow-hidden">
      {/* Decorative blobs */}
      {/* <div className="absolute -top-16 -left-16 w-40 h-40 bg-blue-200 rounded-full mix-blend-multiply opacity-50"></div>
      <div className="absolute -bottom-16 -right-16 w-48 h-48 bg-red-200 rounded-full mix-blend-multiply opacity-40"></div>
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-200 rounded-full mix-blend-multiply opacity-30"></div>
<div className="absolute -top-20 right-10 w-32 h-32 bg-purple-200 rounded-full mix-blend-multiply opacity-40"></div>

<div className="absolute top-80 left-40 w-28 h-28 bg-yellow-200 rounded-full mix-blend-multiply opacity-30"></div>

<div className="absolute top-1/2 right-12 -translate-y-1/2 w-36 h-36 bg-pink-200 rounded-full mix-blend-multiply opacity-30"></div>

<div className="absolute bottom-35 left-12 w-30 h-30 bg-indigo-200 rounded-full mix-blend-multiply opacity-35"></div>

<div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-28 h-28 bg-orange-200 rounded-full mix-blend-multiply opacity-25"></div> */}

      {/*  CASE 1 — Nominee Already Added */}
      {nomineeAdded && !showForm && (
        <div className="bg-white dark:bg-[var(--app-bg)] shadow-lg rounded-2xl p-6 border border-gray-300 mb-10 dark:border-[var(--border-color)]">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-blue-900 dark:text-[var(--text-primary)]">
              Nominee Details
            </h2>

            <span className="text-sm font-medium bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
              Total: {nominees?.length || 0}
            </span>
          </div>

          {/* Nominee List */}
          <div className="space-y-6">
            {nominees?.map((nominee, index) => (
              <div
                key={nominee?.user_id || index}
                className="p-4 rounded-xl border border-gray-200 dark:border-[var(--border-color)] bg-gray-50 dark:bg-[var(--card-bg)]"
              >
                <div className="space-y-2 text-gray-700 dark:text-[var(--text-secondary)]">
                  <p>
                    <strong>Name:</strong> {nominee?.name}
                  </p>
                  <p>
                    <strong>Relationship:</strong> {nominee?.relation}
                  </p>
                  <p>
                    <strong>Allocation:</strong> {nominee?.percentage}%
                  </p>
                  <p>
                    <strong>DOB:</strong> {nominee?.dob}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 mt-4">
                  {/* Edit */}
                  <button
                    onClick={() => {
                      fetchNomineeById(nominee.id)
                      // setNominee(nominee);
                      setShowForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Edit
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteNominee(nominee.id)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New */}
          <div className="mt-6">
            <button
              className="bg-green-600 text-white px-5 py-2 rounded-lg hover:bg-green-700"
              onClick={() => {
                setShowForm(true);
                setNominee({
                  name: "",
                  relation: "",
                  dob: "",
                  mobile: "",
                  email: "",
                  percentage: "",
                  address: "",
                  pincode: "",
                  isMinor: "no",
                  guardianName: "",
                  guardianRelation: "",
                });
                setNomineeAdded(false)
              }}
            >
              + Add New Nominee
            </button>
          </div>
        </div>
      )}

      {/*  CASE 2 — FORM (For Add or Edit) */}
      {showForm || !nomineeAdded ? (
        <div className="bg-white dark:bg-[var(--card-bg)] shadow-lg rounded-2xl p-6 border border-gray-300 dark:border-slate-700  mb-10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl mb-6 font-bold text-blue-900 dark:text-[var(--text-primary)]">
              {nomineeAdded ? "Edit Nominee" : "Add Nominee"}
            </h2>
            <span
              onClick={() => {
                setShowForm(false);
                setNomineeAdded(true);
              }}
              className="mb-6 text-blue-900 font-semibold bg-sky-300 px-2 rounded hover:bg-sky-400 dark:bg-sky-400 px-2 rounded dark:hover:bg-sky-500 cursor-pointer"
            >
              Back
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* NAME */}
            <div>
              <label className="text-sm text-gray-700 dark:text-[var(--text-secondary)]">
                Full Name
              </label>
              <input
                type="text"
                className="
        w-full border p-2 rounded-lg mt-1
        bg-white text-gray-900
        dark:bg-[var(--white-5)]
        dark:text-[var(--text-primary)]
        dark:border-[var(--border-color)]
      "
                placeholder="Ex: Rahul Sharma"
                value={nominee.name}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>

            {/* RELATION */}
            <div>
              <label className="text-sm text-gray-700 dark:text-[var(--text-secondary)]">
                Relationship
              </label>
              <select
                className="
        w-full border p-2 rounded-lg mt-1
        bg-white text-gray-900
        dark:bg-[var(--white-5)]
        dark:text-[var(--text-primary)]
        dark:border-[var(--border-color)]
      "
                value={nominee.relation}
                onChange={(e) => handleChange("relation", e.target.value)}
              >
                <option value="">Select Relation</option>
                <option value="Spouse">Spouse</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Son">Son</option>
                <option value="Daughter">Daughter</option>
                <option value="Brother">Brother</option>
                <option value="Sister">Sister</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* DOB */}
            <div>
              <label className="text-sm text-gray-700 dark:text-[var(--text-secondary)]">
                Date of Birth
              </label>
              <input
                type="date"
                className="
        w-full border p-2 rounded-lg mt-1
        bg-white text-gray-900
        dark:bg-[var(--white-5)]
        dark:text-[var(--text-primary)]
        dark:border-[var(--border-color)]
      "
                value={nominee.dob}
                onChange={(e) => handleChange("dob", e.target.value)}
              />
            </div>

            {/* MOBILE */}
            {/* <div>
              <label className="text-sm text-gray-700 dark:text-[var(--text-secondary)]">
                Mobile Number
              </label>
              <input
                type="number"
                className="
        w-full border p-2 rounded-lg mt-1
        bg-white text-gray-900
        dark:bg-[var(--white-5)]
        dark:text-[var(--text-primary)]
        dark:border-[var(--border-color)]
      "
                placeholder="9876543210"
                value={nominee.mobile}
                onChange={(e) => handleChange("mobile", e.target.value)}
              />
            </div> */}

            {/* EMAIL */}
            {/* <div>
              <label className="text-sm text-gray-700 dark:text-[var(--text-secondary)]">
                Email (Optional)
              </label>
              <input
                type="email"
                className="
        w-full border p-2 rounded-lg mt-1
        bg-white text-gray-900
        dark:bg-[var(--white-5)]
        dark:text-[var(--text-primary)]
        dark:border-[var(--border-color)]
      "
                placeholder="example@gmail.com"
                value={nominee.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div> */}

            {/* ALLOCATION */}
            <div>
              <label className="text-sm text-gray-700 dark:text-[var(--text-secondary)]">
                Allocation (%)
              </label>
              <input
                type="number"
                className="
        w-full border p-2 rounded-lg mt-1
        bg-white text-gray-900
        dark:bg-[var(--white-5)]
        dark:text-[var(--text-primary)]
        dark:border-[var(--border-color)]
      "
                value={nominee.percentage}
                onChange={(e) => handleChange("percentage", e.target.value)}
              />
            </div>

            {/* ADDRESS */}
            {/* <div className="md:col-span-2">
              <label className="text-sm text-gray-700 dark:text-[var(--text-secondary)]">
                Address
              </label>
              <textarea
                rows="2"
                className="
        w-full border p-2 rounded-lg mt-1
        bg-white text-gray-900
        dark:bg-[var(--white-5)]
        dark:text-[var(--text-primary)]
        dark:border-[var(--border-color)]
      "
                placeholder="Enter full address"
                value={nominee.address}
                onChange={(e) => handleChange("address", e.target.value)}
              />
            </div> */}

            {/* PINCODE */}
            {/* <div>
              <label className="text-sm text-gray-700 dark:text-[var(--text-secondary)]">
                Pincode
              </label>
              <input
                type="number"
                className="
        w-full border p-2 rounded-lg mt-1
        bg-white text-gray-900
        dark:bg-[var(--white-5)]
        dark:text-[var(--text-primary)]
        dark:border-[var(--border-color)]
      "
                placeholder="400001"
                value={nominee.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
              />
            </div> */}

            {/* MINOR */}
            {/* <div>
              <label className="text-sm text-gray-700 dark:text-[var(--text-secondary)]">
                Is Nominee a Minor?
              </label>
              <select
                className="
        w-full border p-2 rounded-lg mt-1
        bg-white text-gray-900
        dark:bg-[var(--white-5)]
        dark:text-[var(--text-primary)]
        dark:border-[var(--border-color)]
      "
                value={nominee.isMinor}
                onChange={(e) => handleChange("isMinor", e.target.value)}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div> */}

            {/* GUARDIAN */}
            {/* {nominee.isMinor === "yes" && (
              <>
                <div>
                  <label className="text-sm text-gray-700 dark:text-[var(--text-secondary)]">
                    Guardian Name
                  </label>
                  <input
                    className="
            w-full border p-2 rounded-lg mt-1
            bg-white text-gray-900
            dark:bg-[var(--white-5)]
            dark:text-[var(--text-primary)]
            dark:border-[var(--border-color)]
          "
                    placeholder="Ex: Suresh Kumar"
                    value={nominee.guardianName}
                    onChange={(e) =>
                      handleChange("guardianName", e.target.value)
                    }
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-700 dark:text-[var(--text-secondary)]">
                    Guardian Relationship
                  </label>
                  <input
                    className="
            w-full border p-2 rounded-lg mt-1
            bg-white text-gray-900
            dark:bg-[var(--white-5)]
            dark:text-[var(--text-primary)]
            dark:border-[var(--border-color)]
          "
                    placeholder="Father / Mother"
                    value={nominee.guardianRelation}
                    onChange={(e) =>
                      handleChange("guardianRelation", e.target.value)
                    }
                  />
                </div>
              </>
            )} */}
          </div>

          {/* SAVE BUTTON */}
          <button
            onClick={() => handleSubmit(nominee?.id)}
            className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700"
          >
            Save Nominee
          </button>

          {/* FAQ */}
          <div className="mt-10">
            <h2
              className="
      text-xl font-bold mb-4
      text-blue-950
      dark:text-[var(--text-primary)]
    "
            >
              FAQs
            </h2>

            <div className="space-y-3">
              {faqs.map((item, index) => (
                <div
                  key={index}
                  className="
          rounded-xl p-4 border
          bg-white border-gray-200
          dark:bg-[var(--card-bg)]
          dark:border-[var(--border-color)]
        "
                >
                  <button
                    className="
            w-full flex justify-between font-medium
            text-gray-800
            dark:text-[var(--text-primary)]
          "
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  >
                    {item.q}
                    <span>{openFAQ === index ? "-" : "+"}</span>
                  </button>

                  {openFAQ === index && (
                    <p
                      className="
              mt-2
              text-gray-600
              dark:text-[var(--text-secondary)]
            "
                    >
                      {item.a}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default NomineeSection;
