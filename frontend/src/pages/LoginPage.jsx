import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import AuthFormLayout from '../components/AuthFormLayout';
import FormInput from '../components/FormInput';
import { FaUserCircle, FaEnvelope, FaLock } from 'react-icons/fa';

const LoginPage = ({ setIsLoggedIn }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [backgroundImage, setBackgroundImage] = useState('');
  const navigate = useNavigate();

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    const promise = api.post('/auth/login', formData);

    toast.promise(promise, {
      loading: 'Logging in...',
      success: (res) => {
        localStorage.setItem('token', res.data.token);
        setIsLoggedIn(true);
        navigate('/welcome');
        return 'Welcome back!';
      },
      error: (err) => err.response?.data?.msg || 'Invalid credentials. Please try again.',
    });
  };

  return (
    <AuthFormLayout
      backgroundImage={backgroundImage}
      onBackgroundChange={setBackgroundImage}
      headerIcon={FaUserCircle}
      title="Welcome Back"
      subtitle="Access your excuse history and personalized suggestions."
    >
      <form className="space-y-6" onSubmit={onSubmit}>
        <div className="space-y-4">
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
            aria-label="Sign In"
            tabIndex={0}
          >
            Sign In
          </button>
        </div>
      </form>

      <p className="text-center text-base-content/80 mt-4">
        Don't have an account?{' '}
        <Link
          to="/register"
          className="font-semibold text-primary hover:text-primary/80 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Create an account"
          tabIndex={0}
        >
          Create one here
        </Link>
      </p>
    </AuthFormLayout>
  );
};

export default LoginPage;