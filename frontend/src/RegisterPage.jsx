import { useState } from "react";
import { axiosClient } from "./Api/axios";
import { useNavigate } from "react-router-dom";

export default function ResgPage() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);


  const [form, setForm] = useState({
    nomFr: '',
    prenomFr: '',
    nomAr: '',
    prenomAr: '',
    email: '',
    telephone: '',
    date_de_naissance: '',
    adresse: '',
    role: 'admin',
    password: '', 
    password_confirmation: '',
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validate = () => {
    const newErrors = {};

    if (!form.nomFr.trim()) newErrors.nomFr = "Le nom est requis.";
    else if (form.nomFr.length > 255) newErrors.nomFr = "Le nom ne doit pas dépasser 255 caractères.";

    if (!form.prenomFr.trim()) newErrors.prenomFr = "Le prénom est requis.";
    else if (form.prenomFr.length > 255) newErrors.prenomFr = "Le prénom ne doit pas dépasser 255 caractères.";

    if (!form.nomAr.trim()) newErrors.nomAr = "الاسم بالعربية مطلوب.";

    if (!form.prenomAr.trim()) newErrors.prenomAr = "اللقب بالعربية مطلوب.";

    if (!form.email.trim()) newErrors.email = "L’email est requis.";
    else if (!/^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/.test(form.email)) newErrors.email = "Format de l’email invalide.";
    else if (form.email.length > 255) newErrors.email = "L’email ne doit pas dépasser 255 caractères.";

    if (!form.telephone.trim()) {
      newErrors.telephone = "Le téléphone est requis.";
    } else if (!/^0[56]\d{8}$/.test(form.telephone)) {
      newErrors.telephone = "Le téléphone doit commencer par 05 ou 06 et contenir exactement 10 chiffres.";
    }

    if (!form.date_de_naissance || isNaN(Date.parse(form.date_de_naissance))) {
      newErrors.date_de_naissance = "Date invalide.";
    } else {
      const birthDate = new Date(form.date_de_naissance);
      const ageDifMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDifMs);
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);

        if (age < 20) {
          newErrors.date_de_naissance = "Vous devez avoir plus de 20 ans.";
        }
    }

    if (!form.adresse.trim()) {
        newErrors.adresse = "L’adresse est requise.";
      } else if (form.adresse.length > 255) {
        newErrors.adresse = "L’adresse ne doit pas dépasser 255 caractères.";
      }

    if (!['admin', 'fonctionnaire'].includes(form.role)) newErrors.role = "Rôle invalide.";

    if (!form.password) newErrors.password = "Le mot de passe est requis.";
    else if (form.password.length < 8) newErrors.password = "Le mot de passe doit contenir au moins 8 caractères.";
    else if (!/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/\d/.test(form.password)) {
      newErrors.password = "Le mot de passe doit contenir une majuscule, une minuscule et un chiffre.";
    }

    if (form.password_confirmation !== form.password) {
      newErrors.password_confirmation = "Les mots de passe ne correspondent pas.";
    }

    return newErrors;

  };
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(null);

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    alert(JSON.stringify(form))

    try {
      await axiosClient.get('/sanctum/csrf-cookie');
      const data = await axiosClient.post('/register', form);
      setSuccess('Inscription réussie !');
      setForm({
        nomFr: '',
        prenomFr: '',
        nomAr: '',
        prenomAr: '',
        email: '',
        telephone: '',
        date_de_naissance: '',
        adresse: '',
        role: 'admin',
        password: '',
        password_confirmation: '',
      });
     if (data.status >= 200 && data.status < 300) {
      navigate('/login');
      window.localStorage.setItem('ACCESS_TOKEN', 'allowed');
    }
      setErrors({});
    } catch (err) {
      const msg = err.response?.data?.message || 'Une erreur est survenue.';
      setErrors({ form: msg });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-sky-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full mx-auto p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Créer un compte</h2>

        {errors.form && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            {errors.form}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nomFr" className="block text-sm font-medium text-gray-700 mb-1">Nom (Français)</label>
              {errors.nomFr && <p className="text-red-600 text-xs mt-1">{errors.nomFr}</p>}
              <input
                type="text"
                id="nomFr"
                name="nomFr"
                placeholder="Nom en français"
                value={form.nomFr}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="prenomFr" className="block text-sm font-medium text-gray-700 mb-1">Prénom (Français)</label>
              {errors.prenomFr && <p className="text-red-600 text-xs mt-1">{errors.prenomFr}</p>}
              <input
                type="text"
                id="prenomFr"
                name="prenomFr"
                placeholder="Prénom en français"
                value={form.prenomFr}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nomAr" className="block text-sm font-medium text-gray-700 mb-1">
              النسب
            </label>
              {errors.nomAr && <p className="text-red-600 text-xs mt-1">{errors.nomAr}</p>}
              <input
                type="text"
                id="nomAr"
                name="nomAr"
                placeholder="النسب بالعربية"
                value={form.nomAr}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                dir="rtl"
              />
            </div>
             <div className="rtl text-right">
              <label htmlFor="prenomAr" className="block text-sm font-medium text-gray-700 mb-1">
                الاسم
              </label>
              {errors.prenomAr && <p className="text-red-600 text-xs mt-1">{errors.prenomAr}</p>}
              <input
                type="text"
                id="prenomAr"
                name="prenomAr"
                placeholder="الاسم بالعربية"
                value={form.prenomAr}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                dir="rtl"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Adresse email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="telephone" className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              {errors.telephone && <p className="text-red-600 text-xs mt-1">{errors.telephone}</p>}
              <input
                type="tel"
                id="telephone"
                name="telephone"
                placeholder="Numéro de téléphone"
                value={form.telephone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="date_d_naissance" className="block text-sm font-medium text-gray-700 mb-1">Date de naissance</label>
              {errors.date_de_naissance && <p className="text-red-600 text-xs mt-1">{errors.date_de_naissance}</p>}
              <input
                type="date"
                id="date_de_naissance"
                name="date_de_naissance"
                value={form.date_de_naissance}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="adresse" className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              {errors.adresse && <p className="text-red-600 text-xs mt-1">{errors.adresse}</p>}
              <input
                type="text"
                id="adresse"
                name="adresse"
                placeholder="Adresse complète"
                value={form.adresse}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Password input with visibility toggle */}
  <div className="relative">
    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
    {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
    <input
      type={showPassword ? "text" : "password"}
      id="password"
      name="password"
      placeholder="Créez un mot de passe"
      value={form.password}
      onChange={handleChange}
      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
    />
    {/* Eye icon */}
    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors duration-200"
      tabIndex={-1}
      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
    >
      {showPassword ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
        </svg>
      )}
    </button>
    <p className="text-xs text-gray-500 mt-1">Minimum 8 caractères avec majuscule, minuscule et chiffre</p>
  </div>

  {/* Password confirmation input with visibility toggle */}
  <div className="relative">
    <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">Confirmation</label>
    {errors.password_confirmation && <p className="text-red-600 text-xs mt-1">{errors.password_confirmation}</p>}
    <input
      type={showPasswordConfirm ? "text" : "password"}
      id="password_confirmation"
      name="password_confirmation"
      placeholder="Confirmez le mot de passe"
      value={form.password_confirmation}
      onChange={handleChange}
      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
    />
    {/* Eye icon */}
    <button
      type="button"
      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
      className="absolute right-3 top-9 text-gray-400 hover:text-gray-600 transition-colors duration-200"
      tabIndex={-1}
      aria-label={showPasswordConfirm ? "Masquer la confirmation" : "Afficher la confirmation"}
    >
      {showPasswordConfirm ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
        </svg>
      )}
    </button>
  </div>
</div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-md transition duration-200 ease-in-out transform hover:scale-101"
          >
            S'inscrire
          </button>
        </form>
      </div>
    </div>
  );
}
