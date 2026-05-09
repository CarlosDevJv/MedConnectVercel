import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom'

import { AppShell } from '@/app/layouts/AppShell'
import { PublicLayout } from '@/app/layouts/PublicLayout'
import { Dashboard } from '@/app/pages/Dashboard'
import { RedirectIfAuthed, RequireAuth, RequireRole } from '@/features/auth/guards'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { DoctorDetailsPage } from '@/features/doctors/pages/DoctorDetailsPage'
import { DoctorPasswordCreatePage } from '@/features/doctors/pages/DoctorPasswordCreatePage'
import { DoctorsListPage } from '@/features/doctors/pages/DoctorsListPage'
import { PatientDetailsPage } from '@/features/patients/pages/PatientDetailsPage'
import { PatientFormPage } from '@/features/patients/pages/PatientFormPage'
import { PatientsListPage } from '@/features/patients/pages/PatientsListPage'
import { RegisterPatientPage } from '@/features/patients/pages/RegisterPatientPage'
import { AnalyticsDashboardPage } from '@/features/analytics/pages/AnalyticsDashboardPage'
import { AgendaPage } from '@/features/agenda/pages/AgendaPage'
import { MyDoctorAvailabilityPage } from '@/features/agenda/pages/MyDoctorAvailabilityPage'
import { CommunicationsPage } from '@/features/communications/pages/CommunicationsPage'
import { ReportEditorPage } from '@/features/reports/pages/ReportEditorPage'
import { ReportNewPage } from '@/features/reports/pages/ReportNewPage'
import { ReportsListPage } from '@/features/reports/pages/ReportsListPage'
import { PrivacySecurityPage } from '@/features/transversal/pages/PrivacySecurityPage'
import { SecurityNotificationsHubPage } from '@/features/transversal/pages/SecurityNotificationsHubPage'
import { SecretariasPage } from '@/features/secretarias/pages/SecretariasPage'
import { LandingPage } from '@/features/marketing/pages/LandingPage'
import {
  AGENDA_ROLES,
  ANALYTICS_ROLES,
  COMMUNICATIONS_ROLES,
  DOCTOR_DIRECTORY_ROLES,
  DOCTOR_MANAGEMENT_ROLES,
  PATIENT_FORM_ROLES,
  PATIENT_READ_ROLES,
  REPORT_ROLES,
  SECRETARIA_MANAGEMENT_ROLES,
} from '@/lib/roleGroups'

const appChildren: RouteObject[] = [
  { index: true, element: <Dashboard /> },
  {
    path: 'pacientes',
    element: (
      <RequireRole roles={[...PATIENT_READ_ROLES]}>
        <PatientsListPage />
      </RequireRole>
    ),
  },
  {
    path: 'pacientes/novo',
    element: (
      <RequireRole roles={[...PATIENT_FORM_ROLES]}>
        <PatientFormPage mode="create" />
      </RequireRole>
    ),
  },
  {
    path: 'pacientes/:id',
    element: (
      <RequireRole roles={[...PATIENT_READ_ROLES]}>
        <PatientDetailsPage />
      </RequireRole>
    ),
  },
  {
    path: 'pacientes/:id/editar',
    element: (
      <RequireRole roles={[...PATIENT_FORM_ROLES]}>
        <PatientFormPage mode="edit" />
      </RequireRole>
    ),
  },
  {
    path: 'indicadores',
    element: (
      <RequireRole roles={[...ANALYTICS_ROLES]}>
        <AnalyticsDashboardPage />
      </RequireRole>
    ),
  },
  {
    path: 'medicos',
    element: (
      <RequireRole roles={[...DOCTOR_DIRECTORY_ROLES]}>
        <DoctorsListPage />
      </RequireRole>
    ),
  },
  {
    path: 'medicos/:id',
    element: (
      <RequireRole roles={[...DOCTOR_DIRECTORY_ROLES]}>
        <DoctorDetailsPage />
      </RequireRole>
    ),
  },
  {
    path: 'admin/medico/novo_medico',
    element: (
      <RequireRole roles={[...DOCTOR_MANAGEMENT_ROLES]}>
        <DoctorPasswordCreatePage />
      </RequireRole>
    ),
  },
  {
    path: 'secretarias',
    element: (
      <RequireRole roles={[...SECRETARIA_MANAGEMENT_ROLES]}>
        <SecretariasPage />
      </RequireRole>
    ),
  },
  {
    path: 'disponibilidade',
    element: (
      <RequireRole roles={['medico']}>
        <MyDoctorAvailabilityPage />
      </RequireRole>
    ),
  },
  {
    path: 'agenda',
    element: (
      <RequireRole roles={[...AGENDA_ROLES]}>
        <AgendaPage />
      </RequireRole>
    ),
  },
  {
    path: 'relatorios',
    element: (
      <RequireRole roles={[...REPORT_ROLES]}>
        <ReportsListPage />
      </RequireRole>
    ),
  },
  {
    path: 'relatorios/novo',
    element: (
      <RequireRole roles={[...REPORT_ROLES]}>
        <ReportNewPage />
      </RequireRole>
    ),
  },
  {
    path: 'relatorios/:id/editar',
    element: (
      <RequireRole roles={[...REPORT_ROLES]}>
        <ReportEditorPage />
      </RequireRole>
    ),
  },
  {
    path: 'mensagens',
    element: (
      <RequireRole roles={[...COMMUNICATIONS_ROLES]}>
        <CommunicationsPage />
      </RequireRole>
    ),
  },
  {
    path: 'seguranca-e-notificacoes',
    element: <SecurityNotificationsHubPage />,
  },
  {
    path: 'privacidade',
    element: <PrivacySecurityPage />,
  },
]

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },  {
    element: (
      <RedirectIfAuthed>
        <PublicLayout />
      </RedirectIfAuthed>
    ),
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/cadastro', element: <RegisterPatientPage /> },
    ],
  },
  {
    path: '/app',
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: appChildren,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
