import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthFormLayout from '../components/AuthFormLayout';
import FormInput from '../components/FormInput';
import { FaUserPlus, FaUser, FaEnvelope, FaLock } from 'react-icons/fa';
import api from '../api';

const RegisterPage = ({ setIsLoggedIn }) => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [backgroundImage, setBackgroundImage] = useState('');
  const navigate = useNavigate();

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }
    const promise = api.post('/auth/register', formData);

    toast.promise(promise, {
      loading: 'Creating your account...',
      success: (res) => {
        localStorage.setItem('token', res.data.token);
        setIsLoggedIn(true);
        navigate('/welcome');
        return 'Account created successfully!';
      },
      error: (err) => err.response?.data?.msg || 'Registration failed. Please try again.',
    });
  };

  return (
    <AuthFormLayout
      backgroundImage={backgroundImage}
      onBackgroundChange={setBackgroundImage}
      headerIcon={FaUserPlus}
      title="Join ExcuseMe"
      subtitle="Start generating intelligent excuses in seconds."
    >
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-4">
          <FormInput
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={onChange}
            required
            Icon={FaUser}
            label="Name"
            tabIndex={0}
          />
          <FormInput
            type="email"
            name="email"
            placeholder="email@example.com"
            value={formData.email}
            onChange={onChange}
            required
            Icon={FaEnvelope}
            label="Email address"
            tabIndex={0}
          />
          <FormInput
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={onChange}
            required
            Icon={FaLock}
            label="Password"
            tabIndex={0}
          />
        </div>

        <div>
          <button
            type="submit"
            className="btn btn-primary w-full text-lg font-semibold hover:scale-105 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary rounded-xl"
            aria-label="Sign Up"
            tabIndex={0}
          >
            Sign Up
          </button>
        </div>
      </form>

      <p className="text-center text-base-content/80 mt-4">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-primary hover:text-primary/80 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Sign in"
          tabIndex={0}
        >
          Sign in here
        </Link>
      </p>
    </AuthFormLayout>
  );
};

export default RegisterPage;