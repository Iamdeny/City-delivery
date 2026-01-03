/**
 * Error Boundary компонент для обработки ошибок React
 * Предотвращает полный краш приложения при ошибках в компонентах
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../../utils/logger';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Обновляем состояние, чтобы следующий рендер показал fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Логируем ошибку для мониторинга
    logger.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      errorInfo,
    });

    // Вызываем callback, если он предоставлен
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Можно отправить ошибку в сервис мониторинга (Sentry, LogRocket и т.д.)
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Если предоставлен кастомный fallback, используем его
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Стандартный fallback UI
      return (
        <div className='error-boundary'>
          <div className='error-boundary-content'>
            <div className='error-boundary-icon'>
              <svg
                width='64'
                height='64'
                viewBox='0 0 24 24'
                fill='none'
                xmlns='http://www.w3.org/2000/svg'
              >
                <path
                  d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z'
                  fill='currentColor'
                />
              </svg>
            </div>
            <h2 className='error-boundary-title'>Что-то пошло не так</h2>
            <p className='error-boundary-message'>
              Произошла непредвиденная ошибка. Мы уже работаем над её исправлением.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className='error-boundary-details'>
                <summary>Детали ошибки (только в режиме разработки)</summary>
                <pre className='error-boundary-stack'>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className='error-boundary-actions'>
              <button
                onClick={this.handleReset}
                className='error-boundary-btn error-boundary-btn-primary'
              >
                Попробовать снова
              </button>
              <button
                onClick={this.handleReload}
                className='error-boundary-btn error-boundary-btn-secondary'
              >
                Перезагрузить страницу
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

