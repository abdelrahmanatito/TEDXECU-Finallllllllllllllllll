"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, AlertCircle, AlertTriangle, Info, User, FileText } from "lucide-react"

export function RegistrationForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    phoneType: "egyptian", // Default to Egyptian
    university: "",
    paymentProof: null as File | null,
    personalPhoto: null as File | null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error" | "warning" | "info">("idle")
  const [message, setMessage] = useState("")
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Clear validation error when field is edited
    if (validationErrors[name]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }

    if (name === "phone") {
      // Allow any characters for phone since we're adding a type selector
      setFormData((prev) => ({ ...prev, [name]: value }))
    } else if (name === "name" || name === "university") {
      // For name and university, only allow letters, spaces, and some special characters
      const sanitizedValue = value.replace(/[^a-zA-Z\s\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\u0590-\u05FF.,'-]/g, "")
      setFormData((prev) => ({ ...prev, [name]: sanitizedValue }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fileType: "paymentProof" | "personalPhoto") => {
    const file = e.target.files?.[0] || null

    // Clear previous file validation error
    if (validationErrors[fileType]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[fileType]
        return newErrors
      })
    }

    if (file) {
      // Check file type
      const fileTypeCheck = file.type.toLowerCase()
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]

      // For personal photo, only allow images
      if (fileType === "personalPhoto") {
        const validImageTypes = ["image/jpeg", "image/jpg", "image/png"]
        if (!validImageTypes.includes(fileTypeCheck)) {
          setValidationErrors((prev) => ({
            ...prev,
            [fileType]: "Only JPG and PNG files are accepted for personal photos",
          }))
          return
        }
      } else {
        if (!validTypes.includes(fileTypeCheck)) {
          setValidationErrors((prev) => ({
            ...prev,
            [fileType]: "Only JPG, PNG, and PDF files are accepted",
          }))
          return
        }
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setValidationErrors((prev) => ({
          ...prev,
          [fileType]: "File size must be less than 10MB",
        }))
        return
      }
    }

    setFormData((prev) => ({ ...prev, [fileType]: file }))
  }

  const validateForm = () => {
    const errors: { [key: string]: string } = {}

    // Name validation (5-50 chars, no numbers or special chars)
    if (formData.name.length < 5) {
      errors.name = "Name must be at least 5 characters"
    } else if (formData.name.length > 50) {
      errors.name = "Name must be less than 50 characters"
    }

    // Email validation
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }

    // Phone validation
    if (!formData.phone) {
      errors.phone = "Phone number is required"
    } else if (formData.phoneType === "egyptian" && !/^(01)[0-9]{9}$/.test(formData.phone)) {
      errors.phone = "Egyptian phone numbers must start with 01 and be 11 digits"
    }

    // University validation (same as name)
    if (formData.university.length < 5) {
      errors.university = "University name must be at least 5 characters"
    } else if (formData.university.length > 50) {
      errors.university = "University name must be less than 50 characters"
    }

    // Payment proof validation
    if (!formData.paymentProof) {
      errors.paymentProof = "Payment proof is required"
    }

    // Personal photo validation
    if (!formData.personalPhoto) {
      errors.personalPhoto = "Personal photo is required"
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!validateForm()) {
      setSubmitStatus("error")
      setMessage("Please fix the errors in the form")
      return
    }

    setIsSubmitting(true)
    setSubmitStatus("idle")

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("name", formData.name)
      formDataToSend.append("email", formData.email)
      formDataToSend.append("phone", formData.phone)
      formDataToSend.append("phoneType", formData.phoneType)
      formDataToSend.append("university", formData.university)
      if (formData.paymentProof) {
        formDataToSend.append("paymentProof", formData.paymentProof)
      }
      if (formData.personalPhoto) {
        formDataToSend.append("personalPhoto", formData.personalPhoto)
      }

      const response = await fetch("/api/register", {
        method: "POST",
        body: formDataToSend,
      })

      const result = await response.json()

      if (response.ok) {
        if (result.warning) {
          setSubmitStatus("warning")
          setMessage(result.warning)
        } else {
          setSubmitStatus("success")
          // Use the message from the API response, or fall back to default
          setMessage(
            result.message ||
              "Registration submitted successfully! You will receive a confirmation email once your payment is verified.",
          )
        }

        // Show additional email status if provided
        if (result.emailStatus && !result.emailSent) {
          setMessage((prev) => `${prev}\n\nNote: ${result.emailStatus}`)
        }

        setFormData({
          name: "",
          email: "",
          phone: "",
          phoneType: "egyptian",
          university: "",
          paymentProof: null,
          personalPhoto: null,
        })
        // Reset file inputs
        const paymentInput = document.getElementById("paymentProof") as HTMLInputElement
        const photoInput = document.getElementById("personalPhoto") as HTMLInputElement
        if (paymentInput) paymentInput.value = ""
        if (photoInput) photoInput.value = ""
      } else if (response.status === 409) {
        // Conflict - duplicate email
        setSubmitStatus("info")
        setMessage(result.error || "This email is already registered.")
      } else {
        setSubmitStatus("error")
        setMessage(result.error || "An error occurred during registration.")
      }
    } catch (error) {
      setSubmitStatus("error")
      setMessage("Network error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusIcon = () => {
    switch (submitStatus) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case "info":
        return <Info className="w-5 h-5 text-blue-400" />
      default:
        return null
    }
  }

  const getStatusColor = () => {
    switch (submitStatus) {
      case "success":
        return "border-green-500/50 bg-green-500/10"
      case "warning":
        return "border-yellow-500/50 bg-yellow-500/10"
      case "error":
        return "border-red-500/50 bg-red-500/10"
      case "info":
        return "border-blue-500/50 bg-blue-500/10"
      default:
        return ""
    }
  }

  const getTextColor = () => {
    switch (submitStatus) {
      case "success":
        return "text-green-300"
      case "warning":
        return "text-yellow-300"
      case "error":
        return "text-red-300"
      case "info":
        return "text-blue-300"
      default:
        return ""
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name" className="text-slate-200">
            Full Name *
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            placeholder="Enter your full name (5-50 characters)"
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-red-500"
            minLength={5}
            maxLength={50}
          />
          {validationErrors.name && <p className="mt-1 text-sm text-red-400">{validationErrors.name}</p>}
        </div>
        <div>
          <Label htmlFor="email" className="text-slate-200">
            Email Address *
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="Enter your email"
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-red-500"
          />
          {validationErrors.email && <p className="mt-1 text-sm text-red-400">{validationErrors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="phoneType" className="text-slate-200">
            Phone Number Type *
          </Label>
          <select
            id="phoneType"
            name="phoneType"
            value={formData.phoneType}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white focus:border-red-500"
          >
            <option value="egyptian">Egyptian Phone</option>
            <option value="international">International Phone</option>
          </select>

          <div className="mt-2">
            <Label htmlFor="phone" className="text-slate-200">
              Phone Number *
            </Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              required
              placeholder={formData.phoneType === "egyptian" ? "01xxxxxxxxx (Egyptian)" : "Enter international number"}
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-red-500"
            />
            {validationErrors.phone && <p className="mt-1 text-sm text-red-400">{validationErrors.phone}</p>}
            <p className="mt-1 text-xs text-slate-400">
              {formData.phoneType === "egyptian"
                ? "Egyptian numbers must start with 01 and be 11 digits"
                : "Include country code (e.g., +1 for USA)"}
            </p>
          </div>
        </div>
        <div>
          <Label htmlFor="university" className="text-slate-200">
            University *
          </Label>
          <Input
            id="university"
            name="university"
            value={formData.university}
            onChange={handleInputChange}
            required
            placeholder="Enter your university (5-50 characters)"
            className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-red-500"
            minLength={5}
            maxLength={50}
          />
          {validationErrors.university && <p className="mt-1 text-sm text-red-400">{validationErrors.university}</p>}
        </div>
      </div>

      {/* File Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Photo Upload */}
        <div>
          <Label htmlFor="personalPhoto" className="text-slate-200">
            Personal Photo * (JPG or PNG only)
          </Label>
          <div className="mt-2">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <User className="w-8 h-8 mb-4 text-slate-400" />
                <p className="mb-2 text-sm text-slate-300">
                  <span className="font-semibold">Click to upload</span> your photo
                </p>
                <p className="text-xs text-slate-400">JPG or PNG (MAX. 10MB)</p>
              </div>
              <input
                id="personalPhoto"
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={(e) => handleFileChange(e, "personalPhoto")}
                required
              />
            </label>
            {formData.personalPhoto && (
              <p className="mt-2 text-sm text-green-400">Photo selected: {formData.personalPhoto.name}</p>
            )}
            {validationErrors.personalPhoto && (
              <p className="mt-1 text-sm text-red-400">{validationErrors.personalPhoto}</p>
            )}
          </div>
        </div>

        {/* Payment Proof Upload */}
        <div>
          <Label htmlFor="paymentProof" className="text-slate-200">
            Payment Proof * (JPG, PNG, or PDF)
          </Label>
          <div className="mt-2">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-600 border-dashed rounded-lg cursor-pointer bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileText className="w-8 h-8 mb-4 text-slate-400" />
                <p className="mb-2 text-sm text-slate-300">
                  <span className="font-semibold">Click to upload</span> payment screenshot
                </p>
                <p className="text-xs text-slate-400">JPG, PNG or PDF (MAX. 10MB)</p>
              </div>
              <input
                id="paymentProof"
                type="file"
                className="hidden"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                onChange={(e) => handleFileChange(e, "paymentProof")}
                required
              />
            </label>
            {formData.paymentProof && (
              <p className="mt-2 text-sm text-green-400">File selected: {formData.paymentProof.name}</p>
            )}
            {validationErrors.paymentProof && (
              <p className="mt-1 text-sm text-red-400">{validationErrors.paymentProof}</p>
            )}
          </div>
        </div>
      </div>

      {submitStatus !== "idle" && (
        <Card className={`${getStatusColor()} border`}>
          <CardContent className="pt-4">
            <div className="flex items-start space-x-2">
              {getStatusIcon()}
              <div className="flex-1">
                <p className={`text-sm ${getTextColor()} whitespace-pre-line`}>{message}</p>
                {submitStatus === "info" && (
                  <p className="text-xs text-blue-400 mt-2">
                    If you need to update your registration or have questions, please contact support.
                  </p>
                )}
                {submitStatus === "success" && (
                  <p className="text-xs text-green-400 mt-2">
                    Keep this confirmation for your records. You will be contacted once payment is verified.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="bg-slate-700/30 p-6 rounded-xl border border-slate-600">
        <h4 className="text-white font-semibold mb-3">Order Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>TEDxECU 2025 - General Admission</span>
            <span>1 x 399 EGP</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Processing Fee</span>
            <span>0 EGP</span>
          </div>
          <div className="border-t border-slate-600 pt-2 mt-2">
            <div className="flex justify-between text-white font-semibold text-lg">
              <span>Total</span>
              <span>399 EGP</span>
            </div>
          </div>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 text-lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Processing..." : "Complete Registration (399 EGP)"}
      </Button>
    </form>
  )
}
