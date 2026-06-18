package logger

import (
	"io"
	"os"
	"strings"
	"time"

	"github.com/rs/zerolog"
)

// L is the global logger instance.
var L zerolog.Logger

// Config holds logging configuration.
type Config struct {
	Level  string `yaml:"level"`  // debug / info / warn / error
	Format string `yaml:"format"` // console / json
	File   string `yaml:"file"`   // empty = stdout only, path = also write to file
}

// Init initializes the global logger with the given config.
func Init(cfg Config) {
	level := parseLevel(cfg.Level)
	zerolog.SetGlobalLevel(level)

	var writers []io.Writer

	if strings.ToLower(strings.TrimSpace(cfg.Format)) == "json" {
		writers = append(writers, os.Stdout)
	} else {
		writers = append(writers, zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.DateTime,
		})
	}

	if path := strings.TrimSpace(cfg.File); path != "" {
		f, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
		if err == nil {
			writers = append(writers, f)
		}
	}

	multi := zerolog.MultiLevelWriter(writers...)
	L = zerolog.New(multi).With().Timestamp().Logger()
}

// With returns a new context for building a sub-logger.
func With() zerolog.Context {
	return L.With()
}

// Info starts a new info-level log event.
func Info() *zerolog.Event { return L.Info() }

// Error starts a new error-level log event.
func Error() *zerolog.Event { return L.Error() }

// Warn starts a new warn-level log event.
func Warn() *zerolog.Event { return L.Warn() }

// Debug starts a new debug-level log event.
func Debug() *zerolog.Event { return L.Debug() }

// Fatal starts a new fatal-level log event (calls os.Exit(1) after logging).
func Fatal() *zerolog.Event { return L.Fatal() }

func parseLevel(s string) zerolog.Level {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "debug":
		return zerolog.DebugLevel
	case "warn":
		return zerolog.WarnLevel
	case "error":
		return zerolog.ErrorLevel
	default:
		return zerolog.InfoLevel
	}
}
