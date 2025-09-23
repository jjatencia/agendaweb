import React, { useMemo } from 'react';
import { animated, useSpring } from '@react-spring/web';
import { Appointment } from '../types';
import AppointmentCard from './AppointmentCard';
import PaymentCard from './PaymentCard';
import { useSwipeGestureSimple } from '../hooks/useSwipeGestureSimple';

interface CardStackProps {
  appointments: Appointment[];
  currentIndex: number;
  onNext: () => void;
  onPrevious: () => void;
  onRefresh?: () => void;
  paymentMode?: boolean;
  onCompletePayment?: (appointmentId: string, metodoPago: string) => void;
}

// Style constants - Hacer las tarjetas más grandes y mejor distribuidas
const CONTAINER_STYLE = {
  // Alinear las tarjetas bajo el header y aprovechar mejor el alto disponible
  flex: '1',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'flex-start' as const,
  alignItems: 'center' as const,
  paddingLeft: '1rem',
  paddingRight: '1rem',
  paddingTop: '1.5rem',
  paddingBottom: '72px', // Espacio suficiente para el bottom nav sin dejar hueco extra
  width: '100%',
  height: '100%',
  maxWidth: '560px',
  boxSizing: 'border-box' as const
};

const CARD_STYLES = {
  base: "absolute inset-0 w-full h-full flex justify-center items-start pt-2 transition-all duration-400 ease-in-out",
  current: "absolute inset-0 w-full h-full flex justify-center items-start pt-2"
};

const LAYER_STYLES = {
  prev: { transform: 'translateY(16px) scale(0.94)', opacity: 0.6, zIndex: 1 },
  next: { transform: 'translateY(8px) scale(0.97)', opacity: 0.8, zIndex: 2 },
  current: { touchAction: 'none' as const, zIndex: 50 }
};

const INDICATORS_STYLE = {
  zIndex: 4,
  marginBottom: '0'
};

const CardStack: React.FC<CardStackProps> = ({
  appointments,
  currentIndex,
  onNext,
  onPrevious,
  onRefresh,
  paymentMode = false,
  onCompletePayment
}) => {
  const currentAppointment = useMemo(
    () => appointments[currentIndex],
    [appointments, currentIndex]
  );
  const nextAppointment = useMemo(
    () => appointments[currentIndex + 1],
    [appointments, currentIndex]
  );
  const prevAppointment = useMemo(
    () => appointments[currentIndex - 1],
    [appointments, currentIndex]
  );

  const swipeGesture = useSwipeGestureSimple({
    onSwipeLeft: onNext,
    onSwipeRight: onPrevious,
    onSwipeDown: paymentMode ? undefined : onRefresh,
    disabled: appointments.length <= 1 || paymentMode,
    isFirst: currentIndex === 0,
    isLast: currentIndex === appointments.length - 1
  });

  // Animación flip para el cambio entre tarjeta normal y pago
  const flipAnimation = useSpring({
    transform: paymentMode ? 'rotateY(180deg)' : 'rotateY(0deg)',
    config: { tension: 200, friction: 25 }
  });

  // Force re-render when currentIndex changes to avoid stuck gestures
  React.useEffect(() => {
    // Reset any stuck gesture states when index changes
    (window as any).currentCardIndex = currentIndex;
  }, [currentIndex]);


  if (!currentAppointment) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-xl">No hay citas para esta fecha</p>
        </div>
      </div>
    );
  }


  return (
    <div
      className="relative w-full h-full flex justify-center"
      style={CONTAINER_STYLE}
    >
      {/* Background cards for 3D stack effect */}
      {prevAppointment && (
        <div
          key={`prev-${prevAppointment._id}`}
          className={CARD_STYLES.base}
          style={LAYER_STYLES.prev}
        >
          <AppointmentCard
            appointment={prevAppointment}
            isActive={false}
          />
        </div>
      )}

      {nextAppointment && (
        <div
          key={`next-${nextAppointment._id}`}
          className={CARD_STYLES.base}
          style={LAYER_STYLES.next}
        >
          <AppointmentCard
            appointment={nextAppointment}
            isActive={false}
          />
        </div>
      )}

      {/* Current appointment card with swipe */}
      <animated.div
        key={`swipe-${currentIndex}-${currentAppointment._id}`}
        {...swipeGesture.bind()}
        className={CARD_STYLES.current}
        style={{
          ...swipeGesture.style,
          ...LAYER_STYLES.current,
          ...flipAnimation,
          transformStyle: 'preserve-3d'
        }}
      >
        {/* Lado frontal - Tarjeta normal */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)'
          }}
        >
          <AppointmentCard
            appointment={currentAppointment}
            isActive={true}
          />
        </div>

        {/* Lado trasero - Tarjeta de pago */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <PaymentCard
            appointment={currentAppointment}
            onCompletePayment={onCompletePayment}
          />
        </div>
      </animated.div>

      {/* Visual indicators */}
      {appointments.length > 1 && (
        <div
          className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2"
          style={INDICATORS_STYLE}
        >
          {appointments.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                index === currentIndex
                  ? 'bg-exora-primary'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CardStack;
