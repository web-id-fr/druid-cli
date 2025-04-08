### CLI ###

FROM ubuntu:jammy AS cli

ARG WWWUSER
ARG WWWGROUP

# Fixes some weird terminal issues such as broken clear / CTRL+L
ENV TERM=linux

# Ensure apt doesn't ask questions when installing stuff
ENV DEBIAN_FRONTEND=noninteractive

# Preseed the Microsoft EULA for ttf-mscorefonts-installer to avoid interactive prompt
RUN echo "msttcorefonts msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections

# Install HTTPS transport, update APT cache, and install required packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        apt-transport-https \
        ca-certificates \
        curl \
        unzip \
        gnupg \
        xfonts-base \
        xfonts-75dpi \
        fontconfig \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        ttf-mscorefonts-installer \
    && fc-cache -f \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/doc/*

# Install Ondrej repos for Ubuntu jammy, PHP, composer and selected extensions - better selection than
# the distro's packages
RUN apt-get update \
    && apt-get install -y --no-install-recommends gnupg \
    && echo "deb http://ppa.launchpad.net/ondrej/php/ubuntu jammy main" > /etc/apt/sources.list.d/ondrej-php.list \
    && apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 4F4EA0AAE5267A6C \
    && apt-get update \
    && apt-get -y --no-install-recommends install \
        ca-certificates \
        curl \
        unzip \
        wkhtmltopdf \
        poppler-utils \
        default-mysql-client \
        phpPHPVERSION-apcu \
        phpPHPVERSION-cli \
        phpPHPVERSION-curl \
        phpPHPVERSION-mbstring \
        phpPHPVERSION-opcache \
        phpPHPVERSION-readline \
        phpPHPVERSION-xml \
        phpPHPVERSION-zip \
        phpPHPVERSION-gd \
        phpPHPVERSION-redis \
        phpPHPVERSION-bcmath \
        phpPHPVERSION-intl \
        phpPHPVERSION-mysql \
        phpPHPVERSION-soap \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/doc/* ~/.composer

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

CMD ["php", "-a"]

### FPM ###

FROM cli AS fpm

# Install FPM
RUN apt-get update \
    && apt-get -y --no-install-recommends install phpPHPVERSION-fpm \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/doc/*

STOPSIGNAL SIGQUIT

# PHP-FPM packages need a nudge to make them docker-friendly
COPY php-fpm-overrides.conf /etc/php/PHPVERSION/fpm/pool.d/z-overrides.conf

RUN groupadd --force -g $WWWGROUP web
RUN useradd -ms /bin/bash --no-user-group -g $WWWGROUP -u $WWWUSER web

# Setup php-fpm PID ownership
RUN touch /run/php-fpm.pid && chown web:web /run/php-fpm.pid

USER web

WORKDIR "/application"

CMD ["/usr/sbin/php-fpmPHPVERSION", "-O" ]

# Open up fcgi port
EXPOSE 9000
