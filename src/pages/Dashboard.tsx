import React from 'react';
import CardStack from '../components/CardStack';
import DayView from '../components/DayView';
import DateSelector from '../components/DateSelector';
import ViewModeSelector from '../components/ViewModeSelector';
import BottomNavigation from '../components/BottomNavigation';
import LoadingSpinner from '../components/LoadingSpinner';
import { LogoutIcon } from '../components/icons';
import { useDashboard } from '../hooks/useDashboard';
import { ViewMode } from '../types';

const Dashboard: React.FC = () => {
  const {
    userName,
    isAuthenticated,
    paymentMode,
    currentDate,
    currentIndex,
    viewMode,
    isLoading,
    error,
    showPaidOnly,
    filteredAppointments,
    canGoBack,
    canGoForward,
    handlers
  } = useDashboard();

  const navigationDisabled = filteredAppointments.length === 0;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--exora-background)' }}>
      <header className="bg-white shadow-sm border-b border-gray-200 z-[10000]">
        <div className="max-w-md mx-auto px-4 py-3">
          {/* Primera fila: Saludo y Logout */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">
                Hola, {userName}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600">
                {filteredAppointments.length} citas {showPaidOnly ? 'pagadas' : 'pendientes'}
              </p>
            </div>

            <button
              onClick={handlers.logout}
              className="text-gray-500 hover:text-gray-700 transition-colors p-2 flex-shrink-0"
              title="Cerrar sesión"
            >
              <LogoutIcon size={20} />
            </button>
          </div>

          {/* Segunda fila: Controles */}
          <div className="flex items-center justify-between space-x-2">
            <ViewModeSelector
              currentMode={viewMode}
              onModeChange={handlers.changeViewMode}
            />

            <DateSelector selectedDate={currentDate} onDateChange={handlers.changeDate} />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative overflow-visible min-h-0">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Cargando citas...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-red-600">
              <p className="text-lg font-medium">Error al cargar las citas</p>
              <p className="text-sm mt-2">{error}</p>
              <button
                onClick={handlers.refreshAppointments}
                className="mt-4 px-4 py-2 bg-exora-primary text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Reintentar
              </button>
            </div>
          </div>
        ) : (
          <>
            {viewMode === ViewMode.CARDS ? (
              <div className="flex-1 flex items-stretch justify-center px-4 pt-4 pb-2 sm:pt-6 sm:pb-4">
                <CardStack
                  appointments={filteredAppointments}
                  currentIndex={currentIndex}
                  onNext={handlers.nextAppointment}
                  onPrevious={handlers.previousAppointment}
                  onRefresh={handlers.refreshAppointments}
                  paymentMode={paymentMode}
                  onCompletePayment={handlers.completePayment}
                />
              </div>
            ) : (
              <div className="flex-1 overflow-hidden">
                <DayView
                  appointments={filteredAppointments}
                  selectedDate={currentDate}
                  onAppointmentClick={handlers.selectAppointment}
                />
              </div>
            )}
          </>
        )}
      </main>

      {viewMode === ViewMode.CARDS && (
        <div className="z-10">
          <BottomNavigation
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            onPrevious={paymentMode ? undefined : handlers.previousAppointment}
            onNext={paymentMode ? undefined : handlers.nextAppointment}
            onAdd={handlers.initiatePaymentMode}
            disabled={navigationDisabled}
          />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
