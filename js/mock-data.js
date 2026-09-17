/**
 * JU Bankers' Forum — Demo Data for GitHub Pages
 * Runs automatically when no live backend API is connected.
 * Provides realistic interactive demo experience directly in the browser.
 */

const DEMO_ALUMNI = [
  {
    id: '1',
    name: 'Hasibul Islam',
    batch: '34th',
    subject: 'Geography & Environment',
    bank: 'The World Bank',
    position: 'Consultant — GEMS Focal',
    hall: 'Al-Beruni Hall',
    blood_group: 'B+',
    birthday: '15 October',
    office_location: 'Dhaka CMU Office',
    expertise: 'GIS, Geospatial Analytics, Power BI, KoboToolbox',
    phone: '+880 1811 224441',
    email: 'hasibju@gmail.com',
    address: 'Gendaria, Dhaka 1204',
    photo_url: ''
  },
  {
    id: '2',
    name: 'Tanvir Ahmed',
    batch: '38th',
    subject: 'Economics',
    bank: 'Bangladesh Bank',
    position: 'Assistant Director',
    hall: 'Mir Mosharraf Hossain Hall',
    blood_group: 'A+',
    birthday: '22 March',
    office_location: 'Motijheel, Dhaka',
    expertise: 'Monetary Policy, Financial Regulation',
    phone: '+880 1711 000000',
    email: 'tanvir@bb.org.bd',
    address: 'Dhanmondi, Dhaka',
    photo_url: ''
  },
  {
    id: '3',
    name: 'Sharmin Akter',
    batch: '39th',
    subject: 'Finance & Banking',
    bank: 'Dutch-Bangla Bank',
    position: 'Senior Officer',
    hall: 'Jahanara Imam Hall',
    blood_group: 'O+',
    birthday: '08 July',
    office_location: 'Gulshan Branch, Dhaka',
    expertise: 'Credit Risk, Trade Finance',
    phone: '+880 1812 000000',
    email: 'sharmin@dbbl.com',
    address: 'Uttara, Dhaka',
    photo_url: ''
  },
  {
    id: '4',
    name: 'Mahmudul Hasan',
    batch: '40th',
    subject: 'Computer Science & Engineering',
    bank: 'BRAC Bank PLC',
    position: 'AVP — IT Division',
    hall: 'A.F. Rahman Hall',
    blood_group: 'AB+',
    birthday: '12 December',
    office_location: 'Head Office, Tejgaon, Dhaka',
    expertise: 'Core Banking, Digital Transformation, REST APIs',
    phone: '+880 1913 000000',
    email: 'mahmud@bracbank.com',
    address: 'Mirpur, Dhaka',
    photo_url: ''
  },
  {
    id: '5',
    name: 'Nusrat Jahan',
    batch: '36th',
    subject: 'Marketing',
    bank: 'Islami Bank Bangladesh PLC',
    position: 'Manager',
    hall: 'Pritilata Hall',
    blood_group: 'A-',
    birthday: '05 September',
    office_location: 'Agrabad Branch, Chittagong',
    expertise: 'Islamic Banking, SME Operations',
    phone: '+880 1614 000000',
    email: 'nusrat@ibbl.com.bd',
    address: 'Agrabad, Chittagong',
    photo_url: ''
  },
  {
    id: '6',
    name: 'Rahim Chowdhury',
    batch: '41st',
    subject: 'Accounting & Information Systems',
    bank: 'Eastern Bank PLC',
    position: 'Relationship Manager',
    hall: 'Bangabandhu Sheikh Mujibur Rahman Hall',
    blood_group: 'B-',
    birthday: '30 January',
    office_location: 'Chawkbazar Branch, Sylhet',
    expertise: 'Corporate Banking, Wealth Management',
    phone: '+880 1515 000000',
    email: 'rahim@ebl.com.bd',
    address: 'Zindabazar, Sylhet',
    photo_url: ''
  }
];

function setupDemoFallback() {
  if (typeof API === 'undefined') return;

  const origGetAlumni = API.getAlumni;
  API.getAlumni = async function(params = {}) {
    try {
      return await origGetAlumni(params);
    } catch (e) {
      console.log('⚡ JUBF: Running in Demo Mode (GitHub Pages)');
      let list = [...DEMO_ALUMNI];
      if (params.batch)       list = list.filter(a => a.batch === params.batch);
      if (params.subject)     list = list.filter(a => a.subject === params.subject);
      if (params.bank)        list = list.filter(a => a.bank === params.bank);
      if (params.hall)        list = list.filter(a => a.hall === params.hall);
      if (params.blood_group) list = list.filter(a => a.blood_group === params.blood_group);
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(a =>
          a.name.toLowerCase().includes(q) ||
          a.bank.toLowerCase().includes(q) ||
          a.subject.toLowerCase().includes(q)
        );
      }
      const isLogged = typeof Auth !== 'undefined' && Auth.isLoggedIn();
      return {
        count: list.length,
        is_authenticated: isLogged,
        alumni: list.map(a => {
          if (!isLogged) {
            const { phone, email, address, birthday, ...publicFields } = a;
            return publicFields;
          }
          return a;
        })
      };
    }
  };

  const origGetFilters = API.getFilters;
  API.getFilters = async function() {
    try { return await origGetFilters(); }
    catch (e) {
      return {
        batches:      [...new Set(DEMO_ALUMNI.map(a => a.batch))].sort(),
        subjects:     [...new Set(DEMO_ALUMNI.map(a => a.subject))].sort(),
        banks:        [...new Set(DEMO_ALUMNI.map(a => a.bank))].sort(),
        halls:        [...new Set(DEMO_ALUMNI.map(a => a.hall))].sort(),
        blood_groups: [...new Set(DEMO_ALUMNI.map(a => a.blood_group))].sort()
      };
    }
  };

  const origGetStats = API.getStats;
  API.getStats = async function() {
    try { return await origGetStats(); }
    catch (e) {
      return {
        total_members:     DEMO_ALUMNI.length,
        banks_represented: new Set(DEMO_ALUMNI.map(a => a.bank)).size,
        batches:           new Set(DEMO_ALUMNI.map(a => a.batch)).size,
        departments:       new Set(DEMO_ALUMNI.map(a => a.subject)).size,
        last_updated:      'Live Demo'
      };
    }
  };

  const origGetAlumniById = API.getAlumniById;
  API.getAlumniById = async function(id) {
    try { return await origGetAlumniById(id); }
    catch (e) {
      const record = DEMO_ALUMNI.find(a => a.id === id) || DEMO_ALUMNI[0];
      if (typeof Auth !== 'undefined' && !Auth.isLoggedIn()) {
        const { phone, email, address, birthday, ...publicFields } = record;
        return publicFields;
      }
      return record;
    }
  };
}

document.addEventListener('DOMContentLoaded', setupDemoFallback);
