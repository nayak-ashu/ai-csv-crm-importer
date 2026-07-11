import { CRMLead } from "../types";

export const INITIAL_LEADS: CRMLead[] = [
  {
    id: "lead-1",
    name: "Ritika Sharma",
    email: "ritika@mail.com",
    country_code: "91",
    mobile_without_country_code: "9820294155",
    created_at: "Jul 10, 2026, 2:37 PM",
    company: "Skyline Realty",
    crm_status: "GOOD_LEAD_FOLLOW_UP",
    lead_owner: "Meera Joshi",
    crm_note: "Interested in premium high-rise projects. Budget 2.5 Cr. Prefers WhatsApp communication.",
    possession_time: "Immediate",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    data_source: "leads_facebook_q3_export"
  },
  {
    id: "lead-2",
    name: "Arjun Mehta",
    email: "arjun.m@mail.com",
    country_code: "91",
    mobile_without_country_code: "9021045123",
    created_at: "Jul 10, 2026, 12:23 PM",
    company: "Mehta & Sons",
    crm_status: "GOOD_LEAD_FOLLOW_UP",
    lead_owner: "Meera Joshi",
    crm_note: "Looking for commercial office space in Pune. Prefers ready-to-move-in properties.",
    possession_time: "Immediate",
    city: "Pune",
    state: "Maharashtra",
    country: "India",
    data_source: "leads_facebook_q3_export"
  },
  {
    id: "lead-3",
    name: "Sana Iqbal",
    email: "sana.i@mail.com",
    country_code: "91",
    mobile_without_country_code: "",
    created_at: "Jul 09, 2026, 12:17 PM",
    company: "Aura Design",
    crm_status: "BAD_LEAD",
    lead_owner: "Meera Joshi",
    crm_note: "No phone number available. Sent introductory mail. Status set to Bad Lead due to missing phone.",
    possession_time: "—",
    city: "Hyderabad",
    state: "Telangana",
    country: "India",
    data_source: "leads_facebook_q3_export"
  },
  {
    id: "lead-4",
    name: "Devendra Rao",
    email: "d.rao@mail.com",
    country_code: "91",
    mobile_without_country_code: "8899245100",
    created_at: "Jul 08, 2026, 4:49 PM",
    company: "—",
    crm_status: "SALE_DONE",
    lead_owner: "Meera Joshi",
    crm_note: "Completed site visit of Eden Gardens. Booking advance paid.",
    possession_time: "Immediate",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    data_source: "leads_facebook_q3_export"
  },
  {
    id: "lead-5",
    name: "Priya Nair",
    email: "priya.n@mail.com",
    country_code: "91",
    mobile_without_country_code: "9945612345",
    created_at: "Jul 08, 2026, 11:01 AM",
    company: "Creative Labs",
    crm_status: "GOOD_LEAD_FOLLOW_UP",
    lead_owner: "Meera Joshi",
    crm_note: "Wants villa plots near Sarjapur road. Budget 1.5 Cr.",
    possession_time: "Immediate",
    city: "Kochi",
    state: "Kerala",
    country: "India",
    data_source: "sarjapur_plots"
  },
  {
    id: "lead-6",
    name: "Amit Raheja",
    email: "raheja_amit@gmail.com",
    country_code: "91",
    mobile_without_country_code: "9990110444",
    created_at: "Jul 07, 2026, 2:15 PM",
    company: "Raheja Group",
    crm_status: "DID_NOT_CONNECT",
    lead_owner: "Meera Joshi",
    crm_note: "Call disconnected. Sent follow-up WhatsApp message. Waiting for callback request.",
    possession_time: "3 months",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    data_source: "leads_on_demand"
  }
];

export interface PresetSample {
  name: string;
  filename: string;
  description: string;
  content: string;
  rowCount: number;
}

export const PRESET_SAMPLES: PresetSample[] = [
  {
    name: "Facebook Lead Export",
    filename: "leads_facebook_q3_export.csv",
    description: "Contains raw Facebook lead form export with columns like full_name, phone_number, etc.",
    rowCount: 842,
    content: `"full_name","phone_number","email_address","city_town","ad_campaign_name","lead_src","remarks","internal_agent_id"\n"Ritika Sharma","+91 98202 94155","ritika@mail.com","Bengaluru","Diwali_Offer_Blr","fb_leadgen_form","Interested in 2BHK","AG-4471"\n"Arjun Mehta","+91 90210 45123","arjun.m@mail.com","Pune","Diwali_Offer_Blr","fb_leadgen_form","Ready to buy, premium project","AG-1102"\n"Sana Iqbal","","sana.i@mail.com","Hyderabad","Festive_Push_Q3","fb_leadgen_form","Requires office space","AG-3091"\n"Devendra Rao","+91 88992 45100","d.rao@mail.com","Chennai","Festive_Push_Q3","fb_leadgen_form","Eden Gardens Plot","AG-4471"\n"Priya Nair","+91 99456 12345","priya.n@mail.com","Kochi","Diwali_Offer_Blr","fb_leadgen_form","Sarjapur villa plots","AG-7281"\n"John Doe","+1 415 555 0199","johndoe@work.com","San Francisco","Global_Brand_Awareness","fb_leadgen_form","Immediate possession","AG-1102"`
  },
  {
    name: "Google Ads Export",
    filename: "google_ads_leads_jun.csv",
    description: "Includes default GAds formats with unformatted phone coordinates and campaign names.",
    rowCount: 412,
    content: `"name","phone","email","city","campaign_name","source","comments"\n"Rahul Sen","+919579291101","rahul.sen@test.com","Mumbai","Premium_Inbound","google_ads","Looking for ready-to-move-in flats"\n"Tarvinder Pal","+919811362450","tarvinderpal@beauty.com","Delhi","Premium_Inbound","google_ads","Wants penthouse catalog"\n"Karan Malhotra","+919912345718","karan@techstart.io","Bangalore","Commercial_Quest","google_ads","Requires IT park space"`
  },
  {
    name: "Real Estate CRM Exports",
    filename: "99acres_export.csv",
    description: "Contains property seeker comments, city locations, and budget indications.",
    rowCount: 1203,
    content: `"Buyer Name","Contact Phone","Buyer Email","Location","Ad Campaign","Platform","Buyer Requirements"\n"Rajesh Kumar","+91 9876543210","rajesh.kumar@gmail.com","Mumbai","Premium Villas","99acres","Immediate buy, budget 3 Cr"\n"Sarah Smith","+1 (415) 555-0199","sarah.smith@hotmail.com","San Francisco","Eden Park","99acres","6 months possession"`
  }
];
